import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { UserRepositoryFactory } from "../src/factories/Factories";
import { User } from "../src/entity/User";

const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "1h";
const REFRESH_COOKIE_NAME = "leave_booking_refresh";
const REFRESH_COOKIE_MAX_AGE_MS = 60 * 60 * 1000;

interface RefreshTokenPayload {
  userId: number;
  tokenType: "refresh";
}

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

    const token = this.createAccessToken(user);
    this.setRefreshCookie(res, this.createRefreshToken(user.id));

    res.status(StatusCodes.OK).json({ token });
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = this.getCookie(req, REFRESH_COOKIE_NAME);

    if (!refreshToken) {
      res.status(StatusCodes.UNAUTHORIZED).send("Missing refresh token");
      return;
    }

    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "default-secret",
      ) as RefreshTokenPayload;

      if (payload.tokenType !== "refresh") {
        throw new Error("Invalid token type");
      }

      const userRepository = this.userRepositoryFactory.createUserRepository();
      const user = await userRepository.findByIdWithRelations(payload.userId);

      if (!user) {
        this.clearRefreshCookie(res);
        res.status(StatusCodes.UNAUTHORIZED).send("Invalid refresh token");
        return;
      }

      const token = this.createAccessToken(user);
      this.setRefreshCookie(res, this.createRefreshToken(user.id));
      res.status(StatusCodes.OK).json({ token });
    } catch (error) {
      this.clearRefreshCookie(res);
      res.status(StatusCodes.UNAUTHORIZED).send("Invalid refresh token");
    }
  };

  public logout = async (_req: Request, res: Response): Promise<void> => {
    this.clearRefreshCookie(res);
    res.status(StatusCodes.NO_CONTENT).send();
  };

  private createAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        managerId: user.manager?.id || null,
      },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );
  }

  private createRefreshToken(userId: number): string {
    return jwt.sign(
      { userId, tokenType: "refresh" },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "default-secret",
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    );
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: "/api/auth",
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
    });
  }

  private getCookie(req: Request, name: string): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const cookie = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
  }
}
