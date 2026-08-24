import { Request, Response } from "express";
import { RoleRepository } from "../src/repositories/RoleRepository";
import { StatusCodes } from "http-status-codes";
import { RoleRepositoryFactory } from "../src/factories/Factories";

export class RoleController {
  private roleRepositoryFactory: RoleRepositoryFactory;

  constructor(roleRepositoryFactory: RoleRepositoryFactory) {
    this.roleRepositoryFactory = roleRepositoryFactory;
  }

  // Get all users
  public getAllRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const roleRepository = this.roleRepositoryFactory.createRoleRepository();
      const roles = await roleRepository.findAll();

      if (roles.length === 0) {
        res.status(StatusCodes.NO_CONTENT);
        return;
      }

      res.send(roles);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("Failed to retrieve roles");
    }
  };

  // Get Role by ID
  public getRoleById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const roleRepository = this.roleRepositoryFactory.createRoleRepository();

    if (isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).send("Invalid ID format");
      return;
    }

    try {
      const role = await roleRepository.findById(id);
      if (!role) {
        res.status(StatusCodes.NOT_FOUND).send(`Role not found with ID: ${id}`);
        return;
      }

      res.status(StatusCodes.OK).send(role);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("Failed to retrieve role");
    }
  };
}
