// strategies/microsoft-strategy.ts
import passport from "passport";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import { users } from "../../../core/database/schemas/schema.js";
import db from "../../../core/database/index.js";
import { eq } from "drizzle-orm";

passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      callbackURL: "http://localhost:8000/api/v1/auth/microsoft/callback",
      scope: ["user.read"],
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        console.log(accessToken, refreshToken);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.microsoftId, profile.id))
          .limit(1);

        if (user) {
          return done(null, user);
        } else {
          const [newUser] = await db
            .insert(users)
            .values({
              microsoftId: profile.id,
              email: profile.emails?.[0].value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
            })
            .returning();

          return done(null, newUser);
        }
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
