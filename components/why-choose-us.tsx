"use client"

import { Clock, Heart, Send } from "lucide-react"

const features = [
  {
    title: "Fast Turnaround",
    description:
      "From processing to your pocket in just 120 minutes. No waiting days or weeks.",
    icon: Clock,
  },
  {
    title: "Inclusive Access",
    description:
      "Open to both salaried individuals and those currently seeking employment.",
    icon: Heart,
  },
  {
    title: "Direct Delivery",
    description:
      "Funds sent straight to your registered mobile money account for immediate use.",
    icon: Send,
  },
]

export function WhyChooseUs() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-[#3d7c47] bg-[#f5f5f5] px-4 py-2 text-sm font-medium text-[#3d7c47]">
            Our Advantage
          </span>
          <h2 className="mb-4 text-3xl font-bold text-[#1e3d24] md:text-4xl">
            Why Choose Zim Loan?
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#3d7c47]/20 bg-[#3d7c47]/5">
                <feature.icon className="h-6 w-6 text-[#3d7c47]" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-[#1e3d24]">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
