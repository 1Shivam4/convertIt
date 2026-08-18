export class GotenbergError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GotenbergError";
    this.status = status;
  }
}

export default GotenbergError;
