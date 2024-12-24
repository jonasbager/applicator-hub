import SuperTokens from "supertokens-auth-react";
import ThirdPartyEmailPassword, { Github, Google, Apple } from "supertokens-auth-react/recipe/thirdpartyemailpassword";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";
import { RecipeInterface } from "supertokens-auth-react/recipe/emailpassword";
import { UserInput } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

// Use production URL in production, localhost in development
const SITE_URL = import.meta.env.PROD 
  ? 'https://applymate.app'
  : 'http://localhost:3000';

const SUPERTOKENS_URL = import.meta.env.VITE_SUPERTOKENS_URL || 'http://localhost:3567';

// LinkedIn provider config
const LinkedInProvider = {
    id: "linkedin",
    name: "LinkedIn",
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || "",
    clientSecret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || "",
    scope: ["openid", "profile", "email"],
    authorizationEndpoint: "https://www.linkedin.com/oauth/v2/authorization",
    tokenEndpoint: "https://www.linkedin.com/oauth/v2/accessToken",
    userInfoEndpoint: "https://api.linkedin.com/v2/userinfo",
};

SuperTokens.init({
    appInfo: {
        appName: "ApplyMate",
        apiDomain: SITE_URL,
        websiteDomain: SITE_URL,
        apiBasePath: "/auth",
        websiteBasePath: "/auth"
    },
    recipeList: [
        EmailVerification.init({
            mode: "REQUIRED",
        }),
        ThirdPartyEmailPassword.init({
            signInAndUpFeature: {
                providers: [
                    {
                        id: LinkedInProvider.id,
                        name: LinkedInProvider.name,
                        clientId: LinkedInProvider.clientId,
                        clientSecret: LinkedInProvider.clientSecret,
                        scope: LinkedInProvider.scope.join(" "),
                        authorizationEndpoint: LinkedInProvider.authorizationEndpoint,
                        tokenEndpoint: LinkedInProvider.tokenEndpoint,
                        userInfoEndpoint: LinkedInProvider.userInfoEndpoint,
                    }
                ]
            },
            override: {
                functions: (originalImplementation: RecipeInterface) => {
                    return {
                        ...originalImplementation,
                        // Override email templates here if needed
                        sendPasswordResetEmail: async (input: { email: string; userContext: any }) => {
                            // Keep the same password reset email styling
                            return originalImplementation.sendPasswordResetEmail(input);
                        },
                        sendVerificationEmail: async (input: { email: string; userContext: any }) => {
                            // Keep the same verification email styling
                            return originalImplementation.sendVerificationEmail(input);
                        }
                    };
                }
            }
        }),
        Session.init()
    ]
});

// Export functions that match our current auth interface
export const supertokens = {
    auth: {
        signUp: async (email: string, password: string) => {
            return ThirdPartyEmailPassword.emailPasswordSignUp({
                formFields: [{
                    id: "email",
                    value: email
                }, {
                    id: "password",
                    value: password
                }]
            });
        },
        signIn: async (email: string, password: string) => {
            return ThirdPartyEmailPassword.emailPasswordSignIn({
                formFields: [{
                    id: "email",
                    value: email
                }, {
                    id: "password",
                    value: password
                }]
            });
        },
        signOut: async () => {
            return Session.signOut();
        },
        resetPasswordForEmail: async (email: string) => {
            return ThirdPartyEmailPassword.sendPasswordResetEmail({
                formFields: [{
                    id: "email",
                    value: email
                }]
            });
        },
        updateUser: async ({ password, data }: { password?: string; data?: Record<string, any> }) => {
            if (password) {
                await ThirdPartyEmailPassword.updatePassword(password);
            }
            // Store user metadata in your own database
            // This is where we'll need to make a call to your Supabase database
            return { data: { user: await Session.getUserId() }, error: null };
        },
        getSession: async () => {
            const session = await Session.getAccessTokenPayloadSecurely();
            const userId = await Session.getUserId();
            return {
                data: {
                    session: session ? {
                        user: {
                            id: userId,
                            email: session.email as string,
                            user_metadata: {} // We'll need to fetch this from your Supabase database
                        }
                    } : null
                },
                error: null
            };
        },
        getUser: async () => {
            const userId = await Session.getUserId();
            if (!userId) {
                return { data: { user: null }, error: null };
            }
            const session = await Session.getAccessTokenPayloadSecurely();
            // We'll need to fetch user metadata from your Supabase database
            return {
                data: {
                    user: {
                        id: userId,
                        email: session?.email as string,
                        user_metadata: {}
                    }
                },
                error: null
            };
        },
        signInWithOAuth: async ({ provider }: { provider: string }) => {
            if (provider === 'linkedin_oidc') {
                return ThirdPartyEmailPassword.signInAndUp(LinkedInProvider.id);
            }
            throw new Error(`Unsupported provider: ${provider}`);
        }
    }
};
