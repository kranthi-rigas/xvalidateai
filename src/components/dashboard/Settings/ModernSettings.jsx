import React, { useState } from "react";
import { COLORS } from "@/styles/colors";
import AwsButton from "@/components/common/AwsButton";

export default function ModernSettings() {
  const [activeTab, setActiveTab] = useState("edit");

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences.
          </p>
        </div>
        <div className="hidden sm:block">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Account Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-border">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("edit")}
            className={`py-4 px-1 text-sm font-medium transition-colors ${activeTab === "edit"
              ? "text-primary border-b-2 border-secondary"
              : "border-transparent text-muted-foreground hover:text-primary hover:border-gray-300 border-b-2"
              }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`py-4 px-1 text-sm font-medium transition-colors ${activeTab === "password"
              ? "text-primary border-b-2 border-secondary"
              : "border-transparent text-muted-foreground hover:text-primary hover:border-gray-300 border-b-2"
              }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`py-4 px-1 text-sm font-medium transition-colors ${activeTab === "preferences"
              ? "text-primary border-b-2 border-secondary"
              : "border-transparent text-muted-foreground hover:text-primary hover:border-gray-300 border-b-2"
              }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab("close")}
            className="border-transparent text-destructive hover:text-red-700 hover:border-red-300 py-4 px-1 text-sm font-medium border-b-2 transition-colors ml-auto"
          >
            Close Account
          </button>
        </nav>
      </div>

      {/* Profile Form Container */}
      {activeTab === "edit" && (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Avatar Section */}
          <div className="p-6 sm:p-8 border-b border-border bg-gradient-to-r from-blue-50/50 to-transparent">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
              <div className="relative group flex-shrink-0">
                <div className="w-24 h-24 rounded-full text-white flex items-center justify-center text-2xl font-bold shadow-md ring-4 ring-white overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
                  <span>RP</span>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 text-white rounded-full flex items-center justify-center shadow-sm transition-colors border-2 border-white" style={{ backgroundColor: COLORS.secondary }}>
                  <i className="fa-solid fa-camera text-xs"></i>
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">Your Avatar</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  PNG or JPG no bigger than 800px wide and tall.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-medium bg-white border border-border rounded-lg text-foreground hover:bg-muted transition-colors shadow-sm"
                  >
                    Upload New
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-medium text-destructive hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6 sm:p-8">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
                {/* First Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-foreground"
                  >
                    First Name
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground pointer-events-none">
                      <i className="fa-regular fa-user"></i>
                    </span>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      defaultValue="Rakesh"
                      className="block w-full pl-11 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground placeholder-muted-foreground"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-foreground"
                  >
                    Last Name
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground pointer-events-none">
                      <i className="fa-regular fa-user"></i>
                    </span>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      defaultValue="Polepeddi"
                      className="block w-full pl-11 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground placeholder-muted-foreground"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground pointer-events-none">
                      <i className="fa-regular fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      defaultValue="rakesh@academy51.com"
                      className="block w-full pl-11 pr-24 py-2.5 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground placeholder-muted-foreground"
                    />
                    <span className="absolute right-3 pointer-events-none">
                      <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </span>
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <label htmlFor="country" className="text-sm font-medium text-foreground">
                    Country
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground pointer-events-none">
                      <i className="fa-solid fa-globe"></i>
                    </span>
                    <select
                      id="country"
                      name="country"
                      className="block w-full pl-11 pr-10 py-2.5 bg-white border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground appearance-none cursor-pointer"
                    >
                      <option value="">Select country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="IN" selected>
                        India
                      </option>
                    </select>
                    <span className="absolute right-3 pointer-events-none">
                      <i className="fa-solid fa-chevron-down text-xs text-muted-foreground"></i>
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone Number
                  </label>
                  <div className="flex gap-2 sm:gap-3">
                    <div className="relative w-20 sm:w-24 flex-none flex items-center">
                      <select className="block w-full pl-3 pr-8 py-2.5 bg-white border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground appearance-none cursor-pointer">
                        <option value="+1">+1</option>
                        <option value="+91" selected>
                          +91
                        </option>
                        <option value="+44">+44</option>
                      </select>
                      <span className="absolute right-2 pointer-events-none">
                        <i className="fa-solid fa-chevron-down text-xs text-muted-foreground"></i>
                      </span>
                    </div>
                    <div className="relative flex-1 flex items-center">
                      <span className="absolute left-3 text-muted-foreground pointer-events-none">
                        <i className="fa-solid fa-phone"></i>
                      </span>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="98765 43210"
                        className="block w-full pl-11 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground placeholder-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                  <label htmlFor="jobTitle" className="text-sm font-medium text-foreground">
                    Job Title
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground pointer-events-none">
                      <i className="fa-solid fa-briefcase"></i>
                    </span>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      placeholder="e.g. Senior Developer"
                      className="block w-full pl-11 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground placeholder-muted-foreground"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="bio" className="text-sm font-medium text-foreground">
                    Bio{" "}
                    <span className="text-muted-foreground font-normal ml-1">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    id="bio"
                    rows="3"
                    className="block w-full p-3 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground placeholder-muted-foreground resize-none"
                    placeholder="Brief description for your profile..."
                  ></textarea>
                  <p className="text-xs text-muted-foreground text-right">0/250 characters</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <AwsButton
                  label="Cancel"
                  variant="secondary"
                  onClick={() => { }}
                />
                <AwsButton
                  label="Update Profile"
                  variant="primary"
                  onClick={() => { }}
                >
                  <i className="fa-solid fa-check"></i>
                </AwsButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "password" && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-primary mb-6">Change Password</h2>
          <p className="text-muted-foreground mb-6">
            Update your password to keep your account secure.
          </p>
          {/* Password form would go here */}
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-primary mb-6">Preferences</h2>
          <p className="text-muted-foreground mb-6">
            Customize your experience and notification settings.
          </p>
          {/* Preferences form would go here */}
        </div>
      )}

      {activeTab === "close" && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: COLORS.error }}>Close Account</h2>
          <p className="text-muted-foreground mb-6">
            Permanently delete your account and all associated data.
          </p>
          {/* Close account form would go here */}
        </div>
      )}

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>Last login: Today at 10:42 AM from IP 192.168.1.1</p>
      </div>
    </div>
  );
}

// Made with Bob
