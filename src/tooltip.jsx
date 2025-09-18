import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const TooltipContext = createContext({
  registerAnchor() {},
  unregisterAnchor() {},
});

let tooltipCounter = 0;
const nextTooltipId = () => {
  tooltipCounter += 1;
  return `db90-tooltip-${tooltipCounter}`;
};

const TOOLTIP_ATTR = "data-tooltip";
const TOOLTIP_PLACEMENT_ATTR = "data-tooltip-placement";
const TOOLTIP_ID_ATTR = "data-tooltip-id";

function getTriggerFromTarget(target) {
  if (!(target instanceof Element)) return null;
  return target.closest(`[${TOOLTIP_ATTR}]`);
}

function addDescribedBy(el, id) {
  if (!el || !id) return;
  const prev = el.getAttribute("aria-describedby");
  const tokens = new Set((prev || "").split(/\s+/).filter(Boolean));
  if (!tokens.has(id)) {
    tokens.add(id);
    el.setAttribute("aria-describedby", Array.from(tokens).join(" "));
  }
}

function removeDescribedBy(el, id) {
  if (!el || !id) return;
  const prev = el.getAttribute("aria-describedby");
  if (!prev) return;
  const tokens = prev.split(/\s+/).filter(Boolean).filter((token) => token !== id);
  if (tokens.length) {
    el.setAttribute("aria-describedby", tokens.join(" "));
  } else {
    el.removeAttribute("aria-describedby");
  }
}

export function TooltipProvider({ children }) {
  const [tooltip, setTooltip] = useState(null);
  const hideTimerRef = useRef(null);
  const activeRef = useRef(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hideTooltip = useCallback(
    (trigger) => {
      clearHideTimer();
      setTooltip((current) => {
        if (!current) return null;
        if (trigger && current.trigger && trigger !== current.trigger) return current;
        if (current.describedEl) removeDescribedBy(current.describedEl, current.id);
        activeRef.current = null;
        return null;
      });
    },
    [clearHideTimer]
  );

  const showTooltip = useCallback(
    (trigger, { origin } = {}) => {
      if (!trigger || !trigger.getAttribute) return;
      const label = trigger.getAttribute(TOOLTIP_ATTR);
      if (!label) return;
      const placement = trigger.getAttribute(TOOLTIP_PLACEMENT_ATTR) || "top";
      let id = trigger.getAttribute(TOOLTIP_ID_ATTR);
      if (!id) {
        id = nextTooltipId();
        trigger.setAttribute(TOOLTIP_ID_ATTR, id);
      }

      const describedEl = origin instanceof Element ? origin : trigger;
      addDescribedBy(describedEl, id);

      clearHideTimer();
      const nextState = { id, label, placement, trigger, describedEl };
      activeRef.current = nextState;
      setTooltip(nextState);
    },
    [clearHideTimer]
  );

  useEffect(() => {
    const handlePointerEnter = (event) => {
      if (event.pointerType === "touch") return; // handled on pointerdown
      const trigger = getTriggerFromTarget(event.target);
      if (!trigger) return;
      showTooltip(trigger);
    };

    const handlePointerLeave = (event) => {
      const trigger = getTriggerFromTarget(event.target);
      if (!trigger) return;
      const related = event.relatedTarget;
      if (related instanceof Element && trigger.contains(related)) return;
      hideTooltip(trigger);
    };

    const handlePointerDown = (event) => {
      if (event.pointerType !== "touch") return;
      const trigger = getTriggerFromTarget(event.target);
      if (!trigger) return;
      showTooltip(trigger);
      clearHideTimer();
      hideTimerRef.current = window.setTimeout(() => hideTooltip(trigger), 2000);
    };

    const handleFocusIn = (event) => {
      const trigger = getTriggerFromTarget(event.target);
      if (!trigger) return;
      showTooltip(trigger, { origin: event.target });
    };

    const handleFocusOut = (event) => {
      const trigger = getTriggerFromTarget(event.target);
      if (!trigger) return;
      hideTooltip(trigger);
    };

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      const active = activeRef.current;
      if (active) hideTooltip(active.trigger);
    };

    document.addEventListener("pointerenter", handlePointerEnter, true);
    document.addEventListener("pointerleave", handlePointerLeave, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerenter", handlePointerEnter, true);
      document.removeEventListener("pointerleave", handlePointerLeave, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [showTooltip, hideTooltip, clearHideTimer]);

  useEffect(() => {
    if (!tooltip) return;
    const { trigger } = tooltip;
    if (!trigger) return;
    const observer = new MutationObserver(() => {
      if (!document.body.contains(trigger)) hideTooltip(trigger);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [tooltip, hideTooltip]);

  const contextValue = useMemo(
    () => ({
      showTooltip,
      hideTooltip,
    }),
    [showTooltip, hideTooltip]
  );

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
      <TooltipOverlay tooltip={tooltip} />
    </TooltipContext.Provider>
  );
}

function TooltipOverlay({ tooltip }) {
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!tooltip) {
      setStyle(null);
      return;
    }
    const { trigger, placement } = tooltip;
    if (!trigger) {
      setStyle(null);
      return;
    }

    const updatePosition = () => {
      if (!trigger.isConnected) return;
      const rect = trigger.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      let top = rect.top + scrollY;
      let left = rect.left + scrollX + rect.width / 2;
      let transform = "translate(-50%, calc(-100% - 8px))";

      switch (placement) {
        case "bottom":
          top = rect.bottom + scrollY;
          transform = "translate(-50%, 8px)";
          break;
        case "left":
          left = rect.left + scrollX;
          top = rect.top + scrollY + rect.height / 2;
          transform = "translate(calc(-100% - 8px), -50%)";
          break;
        case "right":
          left = rect.right + scrollX;
          top = rect.top + scrollY + rect.height / 2;
          transform = "translate(8px, -50%)";
          break;
        default:
          break;
      }

      setStyle({ top, left, transform });
    };

    updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updatePosition);
      resizeObserver.observe(trigger);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [tooltip]);

  if (!tooltip || !style) return null;
  const container = document.body;
  if (!container) return null;

  const { id, label, placement } = tooltip;

  return createPortal(
    <div
      id={id}
      role="tooltip"
      className="db90-tooltip"
      data-placement={placement}
      style={style}
      aria-hidden="false"
    >
      {label}
    </div>,
    container
  );
}

export function useTooltipAnchor(options) {
  const config = typeof options === "string" ? { label: options } : options || {};
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !config.label) return undefined;
    node.setAttribute(TOOLTIP_ATTR, config.label);
    if (config.placement) node.setAttribute(TOOLTIP_PLACEMENT_ATTR, config.placement);
    return () => {
      node.removeAttribute(TOOLTIP_ATTR);
      if (config.placement) node.removeAttribute(TOOLTIP_PLACEMENT_ATTR);
    };
  }, [config.label, config.placement]);
  return ref;
}

export function tooltipProps(label, options = {}) {
  const props = { [TOOLTIP_ATTR]: label };
  if (options.placement) props[TOOLTIP_PLACEMENT_ATTR] = options.placement;
  return props;
}

export function useTooltipContext() {
  return useContext(TooltipContext);
}

