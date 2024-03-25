import { FastifyReply, FastifyRequest } from "fastify";
import {
  AssignRoleToUserBody,
  CreateUserBody,
  LoginBody,
} from "./users.schemas";
import { SYSTEM_ROLE } from "../../config/permissions";
import { getRoleByName } from "../roles/roles.services";
import {
  assingRoleToUser,
  createUser,
  getUserByApplication,
  getUserByEmail,
} from "./users.services";
import jwt from "jsonwebtoken";
import { logger } from "../../utils/logger";

export async function createUserHandler(
  request: FastifyRequest<{
    Body: CreateUserBody;
  }>,
  reply: FastifyReply
) {
  const { initialUser, ...data } = request.body;

  const roleName = initialUser
    ? SYSTEM_ROLE.SUPER_ADMIN
    : SYSTEM_ROLE.APPLICATION_USER;

  const role = await getRoleByName({
    name: roleName,
    applicationId: data.applicationId,
  });

  if (roleName === SYSTEM_ROLE.SUPER_ADMIN) {
    const appUsers = await getUserByApplication(data.applicationId);
    if (appUsers.length > 0) {
      return reply.code(400).send({
        message: "User already exists for this application",
        extensions: {
          code: "APPLICATION_ALREADY_SUPER_USER",
          applicationId: data.applicationId,
        },
      });
    }
  }

  if (!role) {
    return reply.code(400).send({
      message: "Role not found",
      extensions: {
        code: "ROLE_NOT_FOUND",
        roleName,
      },
    });
  }

  try {
    const user = await createUser(data);
    //assign the role to the user
    await assingRoleToUser({
      userId: user.id,
      roleId: role.id,
      applicationId: data.applicationId,
    });
    return user;
  } catch (error) {
    return reply.code(500).send({
      message: "Internal server error",
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
}

export async function loginHandler(
  request: FastifyRequest<{
    Body: LoginBody;
  }>,
  reply: FastifyReply
) {
  const { applicationId, email, password } = await request.body;

  const user = await getUserByEmail({ email, applicationId });

  if (!user) {
    return reply.code(401).send({
      message: "Invalid credentials",
      extensions: {
        code: "INVALID_CREDENTIALS",
      },
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email,
      applicationId,
      scopes: user.permissions,
    },
    "secret"
  );
  return { token };
}

export async function assignRoleToUserHandler(
  request: FastifyRequest<{
    Body: AssignRoleToUserBody;
  }>,
  reply: FastifyReply
) {
  const user = request.user;
  const applicationId = user.applicationId;
  const { userId, roleId } = request.body;

  try {
    const result = await assingRoleToUser({
      userId,
      roleId,
      applicationId,
    });
    return result;
  } catch (error) {
    logger.error(`Error assigning role to user: ${error}`);
    return reply.code(500).send({
      message: "Internal server error",
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
}
