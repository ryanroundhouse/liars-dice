export type Result<T> =
    | { ok: boolean, value: T }
    | { ok: boolean, message: string }