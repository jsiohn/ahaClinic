// fabric.d.ts
declare module "fabric" {
  interface IObjectOptions {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    selectable?: boolean;
    evented?: boolean;
    opacity?: number;
    angle?: number;
    scaleX?: number;
    scaleY?: number;
    originX?: "left" | "center" | "right";
    originY?: "top" | "center" | "bottom";
  }

  interface ITextOptions extends IObjectOptions {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    textAlign?: "left" | "center" | "right";
    fontStyle?: string;
  }

  export class Canvas {
    constructor(
      element: HTMLCanvasElement | string,
      options?: {
        isDrawingMode?: boolean;
        selection?: boolean;
        backgroundColor?: string;
        width?: number;
        height?: number;
      }
    );
    isDrawingMode: boolean;
    selection: boolean;
    freeDrawingBrush: {
      color: string;
      width: number;
    };
    add(object: Object): Canvas;
    remove(object: Object): Canvas;
    clear(): Canvas;
    renderAll(): Canvas;
    getActiveObject(): Object | null;
    setActiveObject(object: Object): Canvas;
    dispose(): void;
    toDataURL(options?: { format?: string; quality?: number }): string;
    setWidth(value: number): void;
    setHeight(value: number): void;
    setZoom(value: number): void;
    getZoom(): number;
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
  }

  export class Object {
    selectable: boolean;
    evented: boolean;
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    opacity: number;
    angle: number;
    set(options: IObjectOptions): this;
    setCoords(): void;
    remove(): void;
  }

  export class Text extends Object {
    constructor(text: string, options?: ITextOptions);
    text: string;
    fontSize: number;
    fontFamily: string;
    setText(text: string): Text;
  }

  export class Image extends Object {
    constructor(element: HTMLImageElement, options?: IObjectOptions);
    static fromURL(
      url: string,
      callback: (img: Image) => void,
      options?: IObjectOptions
    ): void;
    scaleToWidth(width: number): void;
    scaleToHeight(height: number): void;
  }

  export class Rect extends Object {
    constructor(options?: IObjectOptions);
  }
}
