import { useRef, useEffect, useState } from "react";
import "./GooeyNav.css";

const GooeyNav = ({
  items,
  initialActiveIndex = 0,
  activeIndex: controlledActiveIndex,
  onActiveChange,
}) => {
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const [internalActiveIndex, setInternalActiveIndex] = useState(initialActiveIndex);
  const isControlled = controlledActiveIndex !== undefined;
  const activeIndex = isControlled ? controlledActiveIndex : internalActiveIndex;

  const updateIndicatorPosition = (element) => {
    if (!containerRef.current || !indicatorRef.current || !element) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    Object.assign(indicatorRef.current.style, {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
      opacity: "1",
    });
  };

  const setActive = (index, liEl) => {
    if (!isControlled) {
      setInternalActiveIndex(index);
    }
    onActiveChange?.(index);
    updateIndicatorPosition(liEl);
  };

  const handleClick = (e, index) => {
    e.preventDefault();
    const liEl = e.currentTarget;
    if (activeIndex === index) return;
    setActive(index, liEl);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const liEl = e.currentTarget.parentElement;
      if (liEl) {
        handleClick({ currentTarget: liEl, preventDefault: () => {} }, index);
      }
    }
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll("li")[activeIndex];
    if (activeLi) {
      updateIndicatorPosition(activeLi);
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll("li")[activeIndex];
      if (currentActiveLi) {
        updateIndicatorPosition(currentActiveLi);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      <span className="gooey-nav-indicator" ref={indicatorRef} aria-hidden />
      <nav aria-label="主导航">
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li key={item.label} className={activeIndex === index ? "active" : ""}>
              <a
                href={item.href || "#"}
                onClick={(e) => handleClick(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-current={activeIndex === index ? "page" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default GooeyNav;
