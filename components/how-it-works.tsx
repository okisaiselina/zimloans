"use client"

import { Smartphone, Users, CreditCard, Zap } from "lucide-react"

const steps = [
  {
    step: 1,
    title: "Sign Up",
    description: "Register with your active phone number in seconds.",
    icon: Smartphone,
  },
  {
    step: 2,
    title: "Provide Details",
    description: "Select your occupation — employed or job-seeking.",
    icon: Users,
  },
  {
    step: 3,
    title: "Select Limit",
    description: "Choose the loan amount that fits your current need.",
    icon: CreditCard,
  },
  {
    step: 4,
    title: "Get Funded",
    description: "Funds credited to your mobile money within 2 hours.",
    icon: Zap,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-[#f5f5f5] py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-[#3d7c47] bg-white px-4 py-2 text-sm font-medium text-[#3d7c47]">
            Simple Process
          </span>
          <h2 className="mb-4 text-3xl font-bold text-[#1e3d24] md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Four easy steps from application to cash in your pocket.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#3d7c47]">
                <item.icon className="h-8 w-8 text-white" />
              </div>
              <p className="mb-2 text-sm font-medium text-[#3d7c47]">
                STEP {item.step}
              </p>
              <h3 className="mb-2 text-lg font-bold text-[#1e3d24]">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
