import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { UserRepositoryFactory } from "../src/factories/Factories";

export class AuthController {
  private userRepositoryFactory: UserRepositoryFactory;
  constructor(userRespositoryFactory: UserRepositoryFactory) {
    this.userRepositoryFactory = userRespositoryFactory;
  }

  // POST /auth/login
  // Accepts credentials and should return a JWT token.
  public login = async (req: Request, res: Response): Promise<void> => {
    const userRepository = this.userRepositoryFactory.createUserRepository();
    const { email, password } = req.body;

    if (!email || !password) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .send("Email and password are required");
      return;
    }

    const user = await userRepository.findByEmailWithRelations(email);

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).send("Invalid credentials");
      return;
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      res.status(StatusCodes.UNAUTHORIZED).send("Invalid credentials");
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role.name,
        managerId: user.manager?.id || null,
      },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "8h" },
    );

    res.status(StatusCodes.OK).json({ token });
  };
}
