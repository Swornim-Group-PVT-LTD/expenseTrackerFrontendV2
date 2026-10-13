
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  Globe,
  MapPin,
  Building2,
  ImagePlus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

// Change this import to the actual path of your existing registration service.
import registerService from "../../services/registerService";

const Register = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",  
    email: "",
    phonenumber: "",
    password: "",
    country: "",
    address: "",
    user_type: "I",
  });

  const [logoUpload, setLogoUpload] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      setIsSuccess(false);
      setLogoUpload(null);
      setImagePreview(null);
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5 MB.");
      setIsSuccess(false);
      setLogoUpload(null);
      setImagePreview(null);
      e.target.value = "";
      return;
    }

    setMessage("");
    setIsSuccess(false);
    setLogoUpload(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isLoading) return;

    setMessage("");
    setIsSuccess(false);

    if (logoUpload && !logoUpload.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      return;
    }

    if (logoUpload && logoUpload.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5 MB.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      // Send the actual image file. Do not send the database path.
      // The backend should store the image and save its relative path.
      if (logoUpload) {
        payload.append("logo_upload", logoUpload, logoUpload.name);
      }

      // Use your existing service instead of calling axios.post here.
      // This assumes the service returns the Axios response.
      const response = await registerService(payload);
      const data = response?.data ?? response;

      const token = data?.access_token;
      const userData = data?.user;

      if (userData) {
        login(userData);
      }

      if (token) {
        document.cookie = `access_token=${token}; path=/; ${
          window.location.protocol === "https:" ? "Secure; " : ""
        }SameSite=Strict`;
      }

      setIsSuccess(true);
      setMessage(data?.message || "Registration successful.");

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Registration error:", error);

      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;

        if (responseData?.errors) {
          const validationErrors = Object.values(
            responseData.errors as Record<string, string[]>
          )
            .flat()
            .join(" ");

          setMessage(
            validationErrors ||
              responseData.message ||
              "Registration failed."
          );
        } else {
          setMessage(
            responseData?.message ||
              "Registration failed. Please check your details and try again."
          );
        }
      } else {
        setMessage(
          "Something went wrong. Please check your registration service."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition duration-200 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-teal-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/60">
        <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
          {/* Branding panel */}
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-(--color1) p-10 text-white lg:flex xl:p-12">
            <div className="pointer-events-none absolute -right-24 top-32 h-64 w-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-12 top-44 h-40 w-40 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/[0.04]" />

            <div className="relative">
              <div className="mb-10 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
                <img
                  src="/app-logo.png"
                  alt="Expense Tracker"
                  className="h-11 w-11 object-contain"
                />
                <div>
                  <p className="text-base font-bold tracking-wide">
                    Expense Tracker
                  </p>
                  <p className="text-xs text-white/60">
                    Smarter money management
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Your financial journey starts here
              </span>

              <h1 className="mt-7 text-4xl font-bold leading-tight xl:text-5xl">
                Take control
                <br />
                of your
                <br />
                <span className="text-amber-300">finances.</span>
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
                Create your account and bring your expenses,
                income, savings, and financial goals together
                in one place.
              </p>
            </div>

            <div className="relative mt-12">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300/15 text-amber-300">
                  <ShieldCheck size={23} />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Your account, your control
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/60">
                    A simple place to organize your finances.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-xs text-white/40">
                © {new Date().getFullYear()} Expense Tracker
              </p>
            </div>
          </aside>

          {/* Registration form */}
          <section className="p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--color1)">
                <img
                  src="/app-logo.png"
                  alt="Expense Tracker"
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Expense Tracker
                </p>
                <p className="text-xs text-slate-500">
                  Smarter money management
                </p>
              </div>
            </div>

            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                <UserRound size={14} />
                CREATE YOUR ACCOUNT
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Get started
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your details below to create your account.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Personal information */}
              <div>
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <UserRound size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first_name" className={labelClass}>
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      autoComplete="given-name"
                      placeholder="Enter first name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="middle_name" className={labelClass}>
                      Middle Name
                    </label>
                    <input
                      id="middle_name"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      autoComplete="additional-name"
                      placeholder="Enter middle name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="last_name" className={labelClass}>
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      autoComplete="family-name"
                      placeholder="Enter last name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="phonenumber" className={labelClass}>
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="phonenumber"
                        type="tel"
                        name="phonenumber"
                        value={formData.phonenumber}
                        onChange={handleChange}
                        required
                        autoComplete="tel"
                        placeholder="Enter phone number"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Account information */}
              <div>
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <LockKeyhole size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Account Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className={labelClass}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <LockKeyhole
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        placeholder="Create a password"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                          formData.user_type === "I"
                            ? "border-teal-700 bg-teal-50/70 ring-1 ring-teal-700/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="user_type"
                          value="I"
                          checked={formData.user_type === "I"}
                          onChange={handleChange}
                          className="h-4 w-4 accent-teal-800"
                        />
                        <UserRound
                          size={18}
                          className={
                            formData.user_type === "I"
                              ? "text-teal-800"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          Individual
                        </span>
                      </label>

                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                          formData.user_type === "C"
                            ? "border-teal-700 bg-teal-50/70 ring-1 ring-teal-700/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="user_type"
                          value="C"
                          checked={formData.user_type === "C"}
                          onChange={handleChange}
                          className="h-4 w-4 accent-teal-800"
                        />
                        <Building2
                          size={18}
                          className={
                            formData.user_type === "C"
                              ? "text-teal-800"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          Company
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location details */}
              <div>
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <MapPin size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Location Details
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="country" className={labelClass}>
                      Country <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Globe
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        autoComplete="country-name"
                        placeholder="Enter your country"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className={labelClass}>
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Enter your full address"
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                </div>
              </div>

              {/* Profile image / company logo */}
              <div>
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <ImagePlus size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Profile Image / Company Logo
                  </h3>
                  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    Optional
                  </span>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 transition hover:border-teal-600">
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImagePlus
                          size={30}
                          className="text-slate-300"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-sm font-semibold text-slate-800">
                        {logoUpload
                          ? logoUpload.name
                          : "Upload your image"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Choose a profile picture or company logo.
                        Image files up to 5 MB.
                      </p>

                      <label
                        htmlFor="logo_upload"
                        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-700 hover:text-teal-800"
                      >
                        <ImagePlus size={15} />
                        Choose Image
                        <input
                          id="logo_upload"
                          type="file"
                          name="logo_upload"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-(--color2) px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition duration-200 hover:brightness-110 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-teal-700/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating your account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    href="/authentication/login"
                    className="font-bold text-teal-800 underline-offset-4 transition hover:text-teal-600 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            {message && (
              <div
                role="alert"
                className={`mt-5 rounded-xl border p-3.5 text-center text-sm font-medium ${
                  isSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default Register;