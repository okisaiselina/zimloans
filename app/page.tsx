import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { LoanPackages } from "@/components/loan-packages"
import { HowItWorks } from "@/components/how-it-works"
import { WhyChooseUs } from "@/components/why-choose-us"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <LoanPackages />
      <HowItWorks />
      <WhyChooseUs />
      <Footer />
    </main>
  )
}
