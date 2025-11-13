/**
 * Scrollable Container
 * 
 * Handles scrolling for content that exceeds the viewport height.
 * Supports mouse wheel scrolling and scrollbar dragging.
 */

export class ScrollableContainer {
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private contentHeight: number = 0;
  private viewportHeight: number = 0;
  private scrollbarWidth: number = 10;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;

  /**
   * Update the content and viewport dimensions.
   */
  updateDimensions(contentHeight: number, viewportHeight: number): void {
    this.contentHeight = contentHeight;
    this.viewportHeight = viewportHeight;
    this.maxScroll = Math.max(0, contentHeight - viewportHeight);
    this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY));
  }

  /**
   * Update scroll position by delta.
   */
  updateScroll(delta: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + delta));
  }

  /**
   * Handle mouse wheel event.
   */
  handleWheel(delta: number): void {
    this.updateScroll(delta * 0.5); // Scroll speed multiplier (reversed to match system settings)
  }

  /**
   * Start dragging the scrollbar.
   */
  startDrag(y: number): void {
    if (this.maxScroll <= 0) return;
    
    const scrollbarY = this.getScrollbarY();
    const scrollbarHeight = this.getScrollbarHeight();
    
    // Check if click is on scrollbar
    if (y >= scrollbarY && y <= scrollbarY + scrollbarHeight) {
      this.isDragging = true;
      this.dragStartY = y;
      this.dragStartScrollY = this.scrollY;
    }
  }

  /**
   * Update drag position.
   */
  updateDrag(y: number): void {
    if (!this.isDragging) return;

    const deltaY = y - this.dragStartY;
    const scrollbarHeight = this.getScrollbarHeight();
    const scrollableHeight = this.viewportHeight - scrollbarHeight;
    
    if (scrollableHeight > 0) {
      const scrollRatio = deltaY / scrollableHeight;
      const newScrollY = this.dragStartScrollY + (scrollRatio * this.maxScroll);
      this.scrollY = Math.max(0, Math.min(this.maxScroll, newScrollY));
    }
  }

  /**
   * Stop dragging.
   */
  stopDrag(): void {
    this.isDragging = false;
  }

  /**
   * Get current scroll offset.
   */
  getScrollY(): number {
    return this.scrollY;
  }

  /**
   * Check if content is scrollable.
   */
  isScrollable(): boolean {
    return this.maxScroll > 0;
  }

  /**
   * Get scrollbar Y position.
   */
  getScrollbarY(): number {
    if (this.maxScroll <= 0) return 0;
    const scrollRatio = this.scrollY / this.maxScroll;
    const scrollableHeight = this.viewportHeight - this.getScrollbarHeight();
    return scrollRatio * scrollableHeight;
  }

  /**
   * Get scrollbar height.
   */
  getScrollbarHeight(): number {
    if (this.maxScroll <= 0) return 0;
    const ratio = this.viewportHeight / this.contentHeight;
    return Math.max(20, this.viewportHeight * ratio); // Minimum 20px height
  }

  /**
   * Render the scrollbar.
   */
  renderScrollbar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    if (!this.isScrollable()) return;

    const scrollbarX = x + width - this.scrollbarWidth - 5;
    const scrollbarY = y + this.getScrollbarY();
    const scrollbarHeight = this.getScrollbarHeight();

    // Scrollbar track
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.fillRect(scrollbarX, y, this.scrollbarWidth, height);

    // Scrollbar thumb
    ctx.fillStyle = this.isDragging 
      ? 'rgba(200, 200, 200, 0.8)' 
      : 'rgba(150, 150, 150, 0.6)';
    ctx.fillRect(scrollbarX, scrollbarY, this.scrollbarWidth, scrollbarHeight);
  }

  /**
   * Check if a point is on the scrollbar.
   */
  isPointOnScrollbar(x: number, y: number, panelX: number, panelY: number, panelWidth: number, panelHeight: number): boolean {
    if (!this.isScrollable()) return false;
    
    const scrollbarX = panelX + panelWidth - this.scrollbarWidth - 5;
    const scrollbarY = panelY + this.getScrollbarY();
    const scrollbarHeight = this.getScrollbarHeight();
    
    return x >= scrollbarX && x <= scrollbarX + this.scrollbarWidth &&
           y >= scrollbarY && y <= scrollbarY + scrollbarHeight;
  }
}

