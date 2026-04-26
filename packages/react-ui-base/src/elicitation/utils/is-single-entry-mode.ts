import type {
  PrimitiveSchemaDefinition as FieldSchema,
  GenuiElicitationRequest,
} from "@workspace/react/mcp";

/** Returns true if this field schema can be represented in the single-entry UI. */
const isSingleEntryEligibleField = (schema: FieldSchema): boolean => {
  return (
    schema.type === "boolean" || (schema.type === "string" && "enum" in schema)
  );
};

export const isSingleEntryMode = (
  request: GenuiElicitationRequest,
): boolean => {
  const fields = Object.entries(request.requestedSchema.properties);
  if (fields.length !== 1) {
    return false;
  }

  const [, schema] = fields[0];
  return isSingleEntryEligibleField(schema);
};
