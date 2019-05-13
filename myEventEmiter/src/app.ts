interface IHandler {
  [event: string]: Array<Function>;
}
interface IEventEmitter {
  handler: IHandler;
  eventCount: number;
  addListener(event: string, listener: (...args: any[]) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
  removeListener(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  // removeAllListeners(event?: string): this;
  // setMaxListeners(n: number): this;
  // getMaxListeners(): number;
  // listeners(event: string): Function[];
  // rawListeners(event: string): Function[];
  emit(event: string, ...args: any[]): boolean;
  // listenerCount(type: string): number;
  // Added in Node 6...
  // prependListener(event: string, listener: (...args: any[]) => void): this;
  // prependOnceListener(event: string, listener: (...args: any[]) => void): this;
  // eventNames(): Array<string>;
}
class EventEmitter implements IEventEmitter {
  handler: IHandler;
  eventCount: number;
  constructor() {
    this.handler = {};
    this.eventCount = 0;
  }
  on(event: string, listener: (...args: any[]) => void) {
    if (!this.handler[event]) {
      this.handler[event] = [];
    }
    if (this.handler.newListener !== undefined) {
      this.emit("newListener", event, listener);
    }
    this.handler[event].push(listener);
    this.eventCount++;
    return this;
  }
  emit(event: string, ...args) {
    if (this.handler[event]) {
      for (let i in this.handler[event]) {
        this.handler[event][i](...args);
      }
    } else {
      return false;
    }
    return true;
  }
  removeListener(event: string, listener: (...args: any[]) => void) {
    let listenerArray: Array<Function> = this.handler[event];
    if (listenerArray === undefined) {
      return this;
    } else {
      for (let i in listenerArray) {
        if (listenerArray[i] === listener) {
          listenerArray.splice(parseInt(i), 1);
          break;
        }
      }
      if (this.handler.removeListener !== undefined) {
        this.emit('removeListener', event, listener);
      }
    }
    return this;
  }
  addListener = this.on;
  off = this.removeListener;
}
