import React, { useEffect, useRef, useState } from "react";
import Preloader from "@/components/common/Preloader.jsx";
import MetaComponent from "@/components/common/MetaComponent.jsx";
import HeaderAuth from "@/components/layout/headers/HeaderAuth.jsx";
import { googleLogin, updateUserProfile } from "@/apiIntegration/auth.js";
import { useNavigate } from "react-router-dom";
import useToast from "@/hooks/useToast";
import { useContextElement } from "@/context/Context";
import { useCountryPhone } from "@/data/useCountryPhone";
import CountrySelect from "@/components/common/CountrySelect";
import PhoneInput from "@/components/common/PhoneInput";
import AuthButton from "@/components/common/AuthButton";
import { COLORS } from "@/styles/colors";

const metadata = {
  title: "XVALIDATEAI - Login",
  description: "Login into application using google login",
};

export default function GoogleLoginPage() {
  const navigate = useNavigate();
  const show = useToast();
  const { refreshUserPlan } = useContextElement();

  // "verifying" while the code is exchanged, "details" when Google gave us an
  // account with no phone or country of its own — Google returns neither, so a
  // first-time social signup has to be asked.
  const [status, setStatus] = useState("verifying");
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    countries,
    selectedCountry,
    phone,
    phoneCode,
    setPhone,
    onCountryChange,
    validatePhone,
  } = useCountryPhone();

  // The authorization code is single-use, so the exchange must not run twice.
  const exchangeStarted = useRef(false);

  useEffect(() => {
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;

    const doLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code) {
        show("Google login failed: missing authorization code", {
          type: "error",
        });
        navigate("/auth?mode=login");
        return;
      }
      try {
        const res = await googleLogin(code);
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        localStorage.setItem("user_info", JSON.stringify(res.user));
        await refreshUserPlan();

        const account = res.user || {};
        if (!account.phone || !account.country) {
          setUser(account);
          setStatus("details");
          return;
        }

        navigate("/dashboard");
      } catch (err) {
        console.error("Google login error", err);
        show(err.message || "Google login failed", { type: "error" });
        navigate("/auth?mode=login");
      }
    };
    doLogin();
  }, [navigate, refreshUserPlan, show]);

  const onPhoneChange = (e) => {
    setError("");
    const value = e.target.value.replace(/\D/g, "");
    // India → 10 digits, everywhere else → up to 15, same rule as signup.
    if (selectedCountry?.label === "India" && value.length > 10) return;
    if (value.length > 15) return;
    setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validatePhone();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const fullPhone = `${phoneCode}${phone}`;
      const country = selectedCountry?.label || "";

      // The profile endpoint replaces the record, so the names Google gave us
      // travel back with it rather than being blanked.
      await updateUserProfile(token, {
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        phone: fullPhone,
        country,
        ...(user?.avatar_url ? { avatar_url: user.avatar_url } : {}),
      });

      const existing = JSON.parse(localStorage.getItem("user_info") || "{}");
      localStorage.setItem(
        "user_info",
        JSON.stringify({ ...existing, phone: fullPhone, country }),
      );

      show("Details saved", { type: "success" });
      navigate("/dashboard");
    } catch (err) {
      const message = err?.message || "Could not save your details";
      setError(message);
      show(message, { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-content">
      <MetaComponent meta={metadata} />
      {status === "verifying" && <Preloader />}

      <HeaderAuth />
      <div className="content-wrapper js-content-wrapper overflow-hidden">
        {status === "verifying" ? (
          <div className="text-center py-60">Redirecting...</div>
        ) : (
          <div className="form-page__content">
            <div className="container">
              <div className="row justify-center py-60">
                <div className="col-xl-5 col-lg-7 col-md-9">
                  <div
                    className="bg-white shadow-4"
                    style={{ borderRadius: 16, padding: "32px 28px" }}
                  >
                    <h3
                      className="text-24 fw-700"
                      style={{ color: COLORS.textPrimary, marginBottom: 6 }}
                    >
                      One last step
                    </h3>
                    <p
                      className="text-14"
                      style={{
                        color: COLORS.textMuted,
                        lineHeight: 1.6,
                        marginBottom: 24,
                      }}
                    >
                      Google does not share a phone number or country. Add them
                      so we can reach you about your account
                      {user?.email ? ` (${user.email})` : ""}.
                    </p>

                    <form onSubmit={handleSubmit}>
                      <div className="row y-gap-20">
                        <div className="col-12">
                          <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                            Country *
                          </label>
                          <CountrySelect
                            countries={countries}
                            value={selectedCountry}
                            onChange={(option) => {
                              setError("");
                              onCountryChange(option);
                            }}
                          />
                        </div>

                        <div className="col-12">
                          <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                            Phone Number *
                          </label>
                          <PhoneInput
                            phone={phone}
                            phoneCode={phoneCode}
                            onChange={onPhoneChange}
                          />
                        </div>

                        {error && (
                          <div className="col-12">
                            <div
                              className="text-14"
                              style={{ color: COLORS.error }}
                            >
                              {error}
                            </div>
                          </div>
                        )}

                        <div className="col-12">
                          <AuthButton
                            type="submit"
                            label={saving ? "Saving…" : "Continue"}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
