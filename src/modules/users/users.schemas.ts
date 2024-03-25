import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

//create user
const createUserBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  applicationId: z.string().uuid(),
  initialUser: z.boolean().optional(),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;

export const createUserJsonSchema = {
  body: zodToJsonSchema(createUserBodySchema, "createUserBodySchema"),
};

//login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  applicationId: z.string(),
});

export type LoginBody = z.infer<typeof loginSchema>;

export const loginJsonSchema = {
  body: zodToJsonSchema(loginSchema, "loginSchema"),
};

//assign role to user
const assignRoleToUserBody = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  applicationId: z.string().uuid(),
});

export type AssignRoleToUserBody = z.infer<typeof assignRoleToUserBody>;

export const assignRoleToUserJsonSchema = {
  body: zodToJsonSchema(assignRoleToUserBody, "assignRoleToUserBody"),
}