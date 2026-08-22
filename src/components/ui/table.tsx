"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { useResizeObserver } from "@react-aria/utils";
import type { ComponentProps, HTMLAttributes, ReactNode, RefObject, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { DragHandle } from "./drag-handle";
import styles from "./table.module.css";

export const COL_WIDTH_UNDEFINED = -1;
export const COL_WIDTH_MINIMUM = 90;
export const TABLE_HEAD_ROW_HEIGHT = 45;

export interface TableColumnConfig {
  key: string;
  resizable?: boolean;
  width?: number | string;
}

type SortDirection = "asc" | "desc";
type ResolvedWidth = number | string | undefined;

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getDefaultColumnTrack(width: ResolvedWidth, { flexible, minimumColumnWidth }: { flexible: boolean; minimumColumnWidth: number }) {
  if (typeof width === "string") return width;
  if (width === undefined || width === COL_WIDTH_UNDEFINED) return `minmax(${minimumColumnWidth}px, auto)`;
  if (width > minimumColumnWidth) return flexible ? `minmax(${width}px, auto)` : `${width}px`;
  return flexible ? `minmax(${minimumColumnWidth}px, auto)` : `${minimumColumnWidth}px`;
}

interface TableContextValue {
  columnIndexByKey: Map<string, number>;
  lastColumnIndex: number;
  minimumColumnWidth: number;
  onResetColumnSize: (event: React.MouseEvent, index: number) => void;
  onResizeEnd: () => void;
  onResizeMove: (delta: number) => void;
  onResizeStart: (index: number, cell: HTMLElement | null) => void;
  resizableByIndex: boolean[];
}

const TableContext = createContext<TableContextValue | null>(null);
const EMPTY_COLUMNS: TableColumnConfig[] = [];

interface ColumnResizeState {
  columnIndex: number;
  moved: boolean;
  width: number;
}

function useColumnResize({ getResizeTemplate, gridRef, onColumnResizeEnd }: {
  getResizeTemplate: (columnIndex: number, newWidth: number) => string;
  gridRef: RefObject<HTMLTableElement | null>;
  onColumnResizeEnd: (columnIndex: number, newWidth: number) => void;
}) {
  const resizeStateRef = useRef<ColumnResizeState | null>(null);
  const frameRef = useRef<number | null>(null);
  const cancelPendingFrame = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);
  useEffect(() => cancelPendingFrame, [cancelPendingFrame]);
  const applyTemplate = useCallback((template: string) => {
    if (gridRef.current) gridRef.current.style.gridTemplateColumns = template;
  }, [gridRef]);
  const onResizeStart = useCallback((columnIndex: number, cell: HTMLElement | null) => {
    resizeStateRef.current = { columnIndex, moved: false, width: cell?.offsetWidth ?? 0 };
  }, []);
  const onResizeMove = useCallback((delta: number) => {
    const state = resizeStateRef.current;
    if (!state) return;
    state.width += delta;
    state.moved = true;
    cancelPendingFrame();
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      applyTemplate(getResizeTemplate(state.columnIndex, Math.round(state.width)));
    });
  }, [applyTemplate, cancelPendingFrame, getResizeTemplate]);
  const onResizeEnd = useCallback(() => {
    const state = resizeStateRef.current;
    if (!state) return;
    cancelPendingFrame();
    resizeStateRef.current = null;
    if (!state.moved) return;
    const width = Math.round(state.width);
    applyTemplate(getResizeTemplate(state.columnIndex, width));
    onColumnResizeEnd(state.columnIndex, width);
  }, [applyTemplate, cancelPendingFrame, getResizeTemplate, onColumnResizeEnd]);
  return { applyTemplate, onResizeEnd, onResizeMove, onResizeStart };
}

function setProperty(element: HTMLElement, property: string, value: string) {
  if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
}

function useObservedColumnSize(elementRef: RefObject<HTMLElement | null>) {
  const [measurements, setMeasurements] = useState({ max: 0, width: 0 });
  const [cell, setCell] = useState<HTMLTableCellElement | null>(null);
  const [table, setTable] = useState<HTMLTableElement | null>(null);
  const measure = useCallback((element: HTMLElement, target: HTMLTableCellElement, grid: HTMLTableElement) => {
    setProperty(element, "--column-resizer-height", `${grid.offsetHeight}px`);
    setProperty(element, "--drag-separator-target-length", `${target.offsetHeight}px`);
    const next = { max: Math.max(grid.clientWidth, target.offsetWidth), width: target.offsetWidth };
    setMeasurements((current) => current.max === next.max && current.width === next.width ? current : next);
  }, []);
  useLayoutEffect(() => {
    const element = elementRef.current;
    const foundCell = element?.closest("th") ?? null;
    const foundTable = foundCell?.closest("table") ?? null;
    setCell(foundCell);
    setTable(foundTable);
    if (element && foundCell && foundTable) measure(element, foundCell, foundTable);
  }, [elementRef, measure]);
  const cellRef = useMemo(() => ({ current: cell }), [cell]);
  const tableRef = useMemo(() => ({ current: table }), [table]);
  const onResize = useCallback(() => {
    const element = elementRef.current;
    if (element && cell && table) measure(element, cell, table);
  }, [cell, elementRef, measure, table]);
  useResizeObserver({ ref: cellRef, onResize });
  useResizeObserver({ ref: tableRef, onResize });
  return { max: measurements.max, width: measurements.width };
}

function getAriaSort(direction: SortDirection | undefined) {
  return direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined;
}

function SortArrow({ direction }: { direction: SortDirection }) {
  return <svg aria-hidden role="img" className={styles.sortArrow} data-direction={direction} height="12" viewBox="0 0 16 16" width="12"><path d="M12.79 6.74C13.08 7.04 13.07 7.51 12.76 7.79C12.46 8.08 11.99 8.07 11.71 7.76L8.75 4.64L8.75 13.25C8.75 13.66 8.41 14 8 14C7.59 14 7.25 13.66 7.25 13.25L7.25 4.63L4.29 7.76C4.01 8.07 3.54 8.08 3.24 7.79C2.93 7.51 2.92 7.04 3.21 6.74L7.46 2.24C7.46 2.23 7.46 2.23 7.46 2.23C7.47 2.22 7.48 2.21 7.48 2.21C7.51 2.18 7.54 2.16 7.57 2.13C7.58 2.13 7.59 2.12 7.6 2.12C7.63 2.1 7.67 2.08 7.7 2.06C7.71 2.06 7.72 2.06 7.73 2.05C7.81 2.02 7.9 2 8 2C8.1 2 8.19 2.02 8.28 2.05C8.29 2.06 8.29 2.06 8.3 2.06C8.34 2.08 8.37 2.1 8.4 2.12C8.41 2.12 8.42 2.13 8.43 2.14C8.46 2.16 8.48 2.18 8.51 2.2C8.52 2.21 8.53 2.22 8.54 2.23C8.54 2.23 8.54 2.23 8.54 2.24L12.79 6.74Z" /></svg>;
}

function OverflowLabel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const isOverflowing = useCallback(() => Boolean(ref.current && ref.current.scrollWidth > ref.current.clientWidth), []);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setOpen((current) => current && isOverflowing()));
    observer.observe(element);
    return () => observer.disconnect();
  }, [isOverflowing]);
  const stopPropagation = (event: React.SyntheticEvent) => event.stopPropagation();
  return <TooltipPrimitive.Root open={open} onOpenChange={(nextOpen) => setOpen(nextOpen && isOverflowing())}>
    <TooltipPrimitive.Trigger render={<div ref={ref} className={styles.label} />} onMouseEnter={() => setOpen(isOverflowing())}>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal><TooltipPrimitive.Positioner side="top" sideOffset={4}><TooltipPrimitive.Popup className={styles.tooltip} data-table-tooltip onClick={stopPropagation} onMouseDown={stopPropagation} onPointerDown={stopPropagation}>{children}</TooltipPrimitive.Popup></TooltipPrimitive.Positioner></TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>;
}

interface TableProps extends Omit<HTMLAttributes<HTMLTableElement>, "children" | "onResize"> {
  children: ReactNode;
  columns?: TableColumnConfig[];
  flexibleLastColumn?: boolean;
  minimumColumnWidth?: number;
  onColumnResize?: (index: number, width: number) => void;
  prependColumnWidths?: string[];
  ref?: RefObject<HTMLTableElement | null>;
}

export function Table({ children, columns = EMPTY_COLUMNS, flexibleLastColumn = true, minimumColumnWidth = COL_WIDTH_MINIMUM, onColumnResize, prependColumnWidths, ref, className, ...props }: TableProps) {
  const internalRef = useRef<HTMLTableElement>(null);
  const gridRef = ref ?? internalRef;
  const [internalWidths, setInternalWidths] = useState<Record<string, number>>({});
  const isControlled = Boolean(onColumnResize);
  const resolveWidth = useCallback((column: TableColumnConfig): ResolvedWidth => isControlled ? column.width : (internalWidths[column.key] ?? column.width), [internalWidths, isControlled]);
  const buildTemplate = useCallback((overrideIndex?: number, overrideWidth?: number) => {
    const tracks = columns.map((column, index) => getDefaultColumnTrack(index === overrideIndex ? overrideWidth : resolveWidth(column), { flexible: flexibleLastColumn && index === columns.length - 1, minimumColumnWidth }));
    return tracks.length ? [...(prependColumnWidths ?? []), ...tracks].join(" ") : "";
  }, [columns, flexibleLastColumn, minimumColumnWidth, prependColumnWidths, resolveWidth]);
  const commitWidth = useCallback((index: number, width: number) => {
    const key = columns[index]?.key;
    if (onColumnResize) onColumnResize(index, width);
    else if (key) setInternalWidths((current) => ({ ...current, [key]: width }));
  }, [columns, onColumnResize]);
  const getResizeTemplate = useCallback((index: number, width: number) => buildTemplate(index, Math.max(width, minimumColumnWidth)), [buildTemplate, minimumColumnWidth]);
  const onColumnResizeEnd = useCallback((index: number, width: number) => commitWidth(index, Math.max(width, minimumColumnWidth)), [commitWidth, minimumColumnWidth]);
  const { applyTemplate, onResizeEnd, onResizeMove, onResizeStart } = useColumnResize({ getResizeTemplate, gridRef, onColumnResizeEnd });
  const onResetColumnSize = useCallback((event: React.MouseEvent, index: number) => {
    event.stopPropagation();
    applyTemplate(buildTemplate(index, COL_WIDTH_UNDEFINED));
    commitWidth(index, COL_WIDTH_UNDEFINED);
  }, [applyTemplate, buildTemplate, commitWidth]);
  const template = buildTemplate();
  const redraw = useCallback(() => { if (template) applyTemplate(template); }, [applyTemplate, template]);
  useLayoutEffect(redraw, [redraw]);
  useEffect(() => { window.addEventListener("resize", redraw); return () => window.removeEventListener("resize", redraw); }, [redraw]);
  const contextValue = useMemo<TableContextValue>(() => ({ columnIndexByKey: new Map(columns.map((column, index) => [column.key, index])), lastColumnIndex: columns.length - 1, minimumColumnWidth, onResetColumnSize, onResizeEnd, onResizeMove, onResizeStart, resizableByIndex: columns.map((column) => column.resizable !== false) }), [columns, minimumColumnWidth, onResetColumnSize, onResizeEnd, onResizeMove, onResizeStart]);
  return <TableContext value={contextValue}><table {...props} ref={gridRef} role="table" className={classNames(styles.table, className)} style={template ? { ...props.style, gridTemplateColumns: template } : props.style}>{children}</table></TableContext>;
}

function Head({ className, sticky, ...props }: ComponentProps<"thead"> & { sticky?: boolean }) { return <thead role="rowgroup" {...props} className={classNames(styles.head, sticky ? styles.sticky : undefined, className)} />; }
function Body({ className, ...props }: ComponentProps<"tbody">) { return <tbody role="rowgroup" {...props} className={classNames(styles.body, className)} />; }
function Row({ className, divider, ...props }: ComponentProps<"tr"> & { divider?: boolean }) { return <tr role="row" {...props} className={classNames(styles.row, divider ? styles.divider : undefined, className)} />; }
function Cell({ className, ...props }: ComponentProps<"td">) { return <td role="cell" {...props} className={classNames(styles.cell, className)} />; }

interface HeadCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  column?: string;
  columnIndex?: number;
  onSort?: () => void;
  overlays?: ReactNode;
  sort?: SortDirection;
}

function HeadCell({ children, className, column, columnIndex, onSort, overlays, sort, ...props }: HeadCellProps) {
  const context = useContext(TableContext);
  const index = columnIndex ?? (column === undefined ? undefined : context?.columnIndexByKey.get(column));
  const showResizer = context !== null && index !== undefined && index !== context.lastColumnIndex && context.resizableByIndex[index] === true;
  const sortable = Boolean(onSort || sort || overlays);
  const cellRef = useRef<HTMLTableCellElement>(null);
  const { max, width } = useObservedColumnSize(cellRef);
  const fallbackId = useId();
  const cellId = props.id || fallbackId;
  return <th aria-sort={getAriaSort(sort)} {...props} id={cellId} ref={cellRef} role="columnheader" className={classNames(styles.headCell, className)}>
    {sortable ? onSort ? <button className={styles.headerContent} type="button" onClick={onSort}>{overlays}<OverflowLabel>{children}</OverflowLabel>{sort ? <SortArrow direction={sort} /> : null}</button> : <div className={styles.headerContent}>{overlays}<OverflowLabel>{children}</OverflowLabel>{sort ? <SortArrow direction={sort} /> : null}</div> : children}
    {showResizer ? <TableResizer onContextMenu={(event) => event.preventDefault()}><DragHandle aria-labelledby={cellId} isSizedFirst max={Math.max(max, context.minimumColumnWidth)} min={context.minimumColumnWidth} orientation="horizontal" value={Math.max(width, context.minimumColumnWidth)} variant="ghost" onDoubleClick={(event) => context.onResetColumnSize(event, index)} onMove={context.onResizeMove} onMoveEnd={context.onResizeEnd} onMoveStart={() => context.onResizeStart(index, cellRef.current)} /></TableResizer> : null}
  </th>;
}

export function TableResizer({ className, ...props }: ComponentProps<"div">) { return <div {...props} className={classNames(styles.resizer, className)} />; }
export function TableStatusCell({ className, ...props }: ComponentProps<"td">) { return <td {...props} className={classNames(styles.statusCell, className)} />; }
function Status({ children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) { return <Row><TableStatusCell {...props} role="cell">{children}</TableStatusCell></Row>; }
function StatusBody(props: TdHTMLAttributes<HTMLTableCellElement>) { return <Body><Status {...props} /></Body>; }

Table.Body = Body;
Table.Cell = Cell;
Table.Head = Head;
Table.HeadCell = HeadCell;
Table.Row = Row;
Table.Status = Status;
Table.StatusBody = StatusBody;
