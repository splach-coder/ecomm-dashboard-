import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "../lib/supabaseClient";
import GridMotion from "../components/animations/GridMotion";

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (performance.navigation.type === 1) {
      navigate("/login", { replace: true });
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            // Store JWT in localStorage if rememberMe is true, otherwise in sessionStorage
            remember: rememberMe,
          },
        });

        if (error) throw error;

        // Store user data in localStorage if rememberMe is checked
        if (rememberMe) {
          localStorage.setItem(
            "supabase.auth.token",
            JSON.stringify(data.session)
          );
        }

        navigate("/dashboard");
      } else {
        // Signup logic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        if (error) throw error;

        // Show success message or automatically log in
        setIsLogin(true);
        setError({
          message: t('success.accountCreated'),
          type: "success",
        });
      }
    } catch (error) {
      setError({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setError({ message: error.message, type: "error" });
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    console.log("handled");

    if (!email) {
      setError({ message: t('errors.emailRequired'), type: "error" });
      return;
    }

    if (!validateEmail(email)) {
      setError({
        message: t('errors.invalidEmail'),
        type: "error",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) throw error;

      setResetSent(true);
      setError({
        message: t('success.resetLinkSent'),
        type: "success",
      });
    } catch (error) {
      setError({
        message: error.message || t('errors.resetLinkFailed'),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-oceanblue">
      {/* Left side with GridMotion */}
      <div className="hidden md:flex md:w-1/2 relative">
        <GridMotion gradientColor="oceanblue" />

        
      </div>

      {/* Right side with form */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className={`w-full h-auto flex justify-center`}>
            <img
              src={"images/logo.png"}
              alt={t('labels.websiteLogo')}
              className="w-[150px] h-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-oceanblue mb-2 text-center">
            {isLogin ? t('titles.loginAccount') : t('titles.createAccount')}
          </h1>

          {isLogin && (
            <p className="text-gray-600 mb-8 text-center">
              {t('labels.noAccount')}{" "}
              <button
                //onClick={() => setIsLogin(false)}
                className="text-fog font-medium hover:underline"
              >
                {t('labels.contactOwner')}
              </button>
            </p>
          )}

          {!isLogin && (
            <p className="text-gray-600 mb-8 text-center">
              {t('labels.haveAccount')}{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="text-fog font-medium hover:underline"
              >
                {t('labels.loginHere')}
              </button>
            </p>
          )}

          {error && (
            <div
              className={`p-3 rounded mb-4 ${
                error.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {error.message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder={t('placeholders.firstName')}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-fog"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={t('placeholders.lastName')}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-fog"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder={t('placeholders.email')}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-fog"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t('placeholders.password')}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-fog"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-fog focus:ring-fog border-gray-300 rounded"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {t('labels.rememberMe')}
                  </label>
                </div>

                {!resetSent ? (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-sm text-fog hover:underline"
                  >
                    {t('labels.forgotPassword')}
                  </button>
                ) : (
                  <span className="text-sm text-green-600">
                    {t('labels.resetLinkSent')}
                  </span>
                )}
              </div>
            )}

            {!isLogin && (
              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-fog focus:ring-fog border-gray-300 rounded"
                  required
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {t('labels.agreeToTerms')}{" "}
                  <a href="#" className="text-fog hover:underline">
                    {t('labels.termsConditions')}
                  </a>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-tumbleweed hover:bg-opacity-90 text-white font-medium py-3 px-4 rounded transition duration-150 ease-in-out"
              disabled={loading}
            >
              {loading
                ? t('labels.processing')
                : isLogin
                ? t('buttons.login')
                : t('buttons.createAccount')}
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('labels.orRegisterWith')}
                </span>
              </div>
            </div>

            <div className="w-full">
              <button
                type="button"
                disabled={true}
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path
                      fill="#4285F4"
                      d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                    />
                    <path
                      fill="#34A853"
                      d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                    />
                  </g>
                </svg>
                {t('buttons.continueWithGoogle')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;