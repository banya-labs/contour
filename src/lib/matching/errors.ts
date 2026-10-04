export class MatchingError extends Error {
  constructor(message: string, public status = 404) { super(message); this.name = "MatchingError"; }
}
