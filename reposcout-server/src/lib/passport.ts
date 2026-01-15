import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import prisma from './prisma';

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            githubId?: string | null;
        }
    }
}

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5555/auth/github/callback',
            scope: ['user:email'],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
            try {
                console.log("[Passport] GitHub Profile received:", profile.username);

                const githubId = profile.id;
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

                console.log("[Passport] Extracted Email:", email);

                if (!email) {
                    console.error("[Passport] Error: No email found in profile.");
                    return done(new Error('No email found in GitHub profile'), null);
                }

                let user = await prisma.user.findUnique({
                    where: { githubId: githubId },
                });

                if (user) {
                    console.log("[Passport] User found by GitHub ID. Logging in.");
                    return done(null, user);
                }

                console.log("[Passport] No GitHub ID match. Checking email...");
                user = await prisma.user.findUnique({
                    where: { email: email },
                });

                if (user) {
                    console.log("[Passport] User found by Email. Linking account.");
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { githubId: githubId },
                    });
                    return done(null, user);
                }

                console.log("[Passport] Creating new user...");
                user = await prisma.user.create({
                    data: {
                        email: email,
                        githubId: githubId,
                        passwordHash: null,
                    },
                });
                console.log("[Passport] User created successfully.");

                return done(null, user);

            } catch (error) {
                console.error("[Passport] Critical Error:", error);
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;