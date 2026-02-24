export class ModalRef<T = any> {
  private _resolver!: (value: T | null) => void;

  readonly closed = new Promise<T | null>((res) => {
    this._resolver = res;
  });

  close(result: T | null = null) {
    this._resolver(result);
  }

  afterClosed(): Promise<T | null> {
    return this.closed;
  }
}
