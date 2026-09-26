export function parseBody(schema, body) {
  const result = schema.safeParse(body)
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(' '))
    error.status = 400
    throw error
  }
  return result.data
}