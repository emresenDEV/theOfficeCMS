import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { FiEye, FiEyeOff } from "react-icons/fi";
import PropTypes from "prop-types";

const LoginPage = ({ setUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null); 
    
        try {
            const userData = await loginUser(username, password);
            console.log("Login Successful: ", userData); 
    
            localStorage.setItem("user", JSON.stringify(userData.user)); // Store user in localStorage
            setUser(userData.user); 
            navigate("/"); 
            
        } catch (error) {
            setError(`Invalid username or password: ${error.message}`);
        }
    };
    

    const coreFeatures = [
        "Pipeline + payment gating",
        "RBAC + audit trail",
        "Commissions & incentives",
        "Contact relationship management",
        "Accounts + invoicing in one flow",
    ];

    const secondaryFeatures = [
        "Calendar + tasks",
        "Notifications & follow-up SLAs",
        "Analytics by rep + global view",
        "Mobile-friendly views",
        "Timezone-aware timestamps",
    ];

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.15),_transparent_55%),radial-gradient(circle_at_20%_90%,_hsl(var(--info)/0.18),_transparent_50%)]"
            style={{ fontFamily: '"IBM Plex Sans", "Space Grotesk", sans-serif' }}
        >
            <div className="absolute -top-20 right-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-10 left-6 h-48 w-48 rounded-full bg-info/20 blur-3xl" />
            <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
                <section className="flex-1 animate-fade-in space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Demo CRM+ platform
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Custom build
                        </span>
                    </div>
                    <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                        This is a demo of a CRM that sells with you.
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        A custom solution that combines CRM, payments, pipeline management, RBAC, commissions,
                        and relationship intelligence in one workflow. Designed for teams that need more than
                        a traditional CRM.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-border bg-card/90 p-4 shadow-card">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Core features
                            </h2>
                            <ul className="mt-3 space-y-2 text-sm text-foreground">
                                {coreFeatures.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-lg border border-border bg-card/90 p-4 shadow-card">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Secondary features
                            </h2>
                            <ul className="mt-3 space-y-2 text-sm text-foreground">
                                {secondaryFeatures.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-info" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card/90 p-4 shadow-card">
                        <p className="text-sm text-foreground">
                            Problem solved: eliminate the split between CRM and revenue systems. CRM+ turns
                            pipeline, billing, and follow-up into one accountable workflow.
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Developed by Monica Nieckula •{" "}
                            <a
                                className="font-semibold text-primary hover:underline"
                                href="mailto:monica.mrez@gmail.com"
                            >
                                monica.mrez@gmail.com
                            </a>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Demo environment with mock data + a few Office-style easter eggs.
                        </p>
                    </div>
                </section>

                <section className="w-full max-w-md animate-fade-in">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
                        <h2 className="text-2xl font-semibold text-foreground">Sign in</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Access the demo workspace.
                        </p>
                        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

                        <form onSubmit={handleLogin} className="mt-5 space-y-3">
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            />

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                                Login
                            </button>
                        </form>
                        <div className="mt-4 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                            This is a demo workspace. Reach out to the creator at{" "}
                            <a
                                className="font-semibold text-primary hover:underline"
                                href="mailto:monica.mrez@gmail.com"
                            >
                                monica.mrez@gmail.com
                            </a>{" "}
                            for credentials to view the demo.
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

LoginPage.propTypes = {
    setUser: PropTypes.func.isRequired, 
};

export default LoginPage;
