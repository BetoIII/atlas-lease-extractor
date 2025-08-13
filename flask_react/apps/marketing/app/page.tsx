import Link from "next/link"
import { Button, Card, CardContent } from "@atlas/ui"
import { FileText, Shield, CheckCircle, ArrowRight, BarChart3, FileSpreadsheet, Building2 } from "lucide-react"
import { MarketingNavbar } from "@atlas/ui"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNavbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Turn PDFs into clean, audit-ready lease data — in minutes
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    <em>AI lease abstraction for professionals who need it to be right</em>
                  </p>
                </div>
                <div className="space-y-4 text-gray-500 dark:text-gray-400">
                  <p className="max-w-[600px] md:text-lg">
                    Atlas is built for commercial real estate appraisers and brokers who spend too much time reviewing
                    leases, rent rolls, and valuations by hand.
                  </p>
                  <p className="max-w-[600px] md:text-lg font-medium">
                    Upload a document. Get structured terms.
                    <br />
                    No guesswork. No noise. Just the data you need — fast, private, and accurate.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="px-8">
                    <Link href="#demo">
                      Request a Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] h-[400px] overflow-hidden rounded-lg border bg-background p-2 shadow-xl">
                  <div className="absolute top-0 left-0 right-0 h-10 bg-muted/50 flex items-center px-4 border-b">
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="mx-auto text-xs text-muted-foreground">Lease Document Analysis</div>
                  </div>
                  <div className="mt-10 grid grid-cols-2 gap-4 p-4">
                    <div className="col-span-1 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 flex flex-col items-center justify-center text-center">
                      <FileText className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Lease Document</p>
                      <p className="text-xs text-gray-400">PDF Format</p>
                    </div>
                    <div className="col-span-1 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                        <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                        <div className="h-4 w-5/6 rounded bg-gray-200"></div>
                      </div>
                    </div>
                    <div className="col-span-2 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="h-4 w-1/3 rounded bg-gray-200"></div>
                          <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="h-4 w-2/5 rounded bg-gray-200"></div>
                          <div className="h-4 w-1/5 rounded bg-gray-200"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                          <div className="h-4 w-1/3 rounded bg-gray-200"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="h-4 w-3/5 rounded bg-gray-200"></div>
                          <div className="h-4 w-1/6 rounded bg-gray-200"></div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 rounded-md border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <div className="h-4 w-2/3 rounded bg-green-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm">Key Benefits</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why choose Atlas?</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed specifically for commercial real estate professionals
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="border-2 border-primary/20 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">98%+ first-pass accuracy</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Trained specifically on CRE documents — not chatbot filler
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Private by default</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No data is shared or reused without your permission
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Audit-ready outputs</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Field-level traceability and optional human review
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="use-cases" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm">Use Cases</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Made for appraisers.
                  <br />
                  Built to scale.
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We're starting with the workflows that matter most: lease abstraction, rent roll parsing, and tenant
                  data extraction.
                </p>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-medium">
                  You bring the document.
                  <br />
                  We handle the structure.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-2">
                      <FileText className="h-10 w-10 text-primary mb-2" />
                      <h3 className="text-xl font-bold">Lease Abstraction</h3>
                      <p className="text-sm text-gray-500">
                        Extract key terms, dates, and financial data from complex lease agreements
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-2">
                      <BarChart3 className="h-10 w-10 text-primary mb-2" />
                      <h3 className="text-xl font-bold">Rent Roll Parsing</h3>
                      <p className="text-sm text-gray-500">Convert messy rent rolls into structured, analyzable data</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-2">
                      <Building2 className="h-10 w-10 text-primary mb-2" />
                      <h3 className="text-xl font-bold">Tenant Data</h3>
                      <p className="text-sm text-gray-500">
                        Extract and organize tenant information for portfolio analysis
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-2">
                      <FileSpreadsheet className="h-10 w-10 text-primary mb-2" />
                      <h3 className="text-xl font-bold">Data Export</h3>
                      <p className="text-sm text-gray-500">
                        Export to Excel, CSV, or integrate directly with your existing systems
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to transform your workflow?
                </h2>
                <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  See how Atlas can save you hours of manual work and improve your data accuracy
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                <form className="grid gap-4">
                  <div className="grid gap-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
                      placeholder="Your name"
                      type="text"
                    />
                  </div>
                  <div className="grid gap-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
                      placeholder="Your email"
                      type="email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
                      placeholder="Company name"
                      type="text"
                    />
                  </div>
                  <Button type="submit" size="lg" variant="secondary" className="w-full">
                    Request a Demo
                  </Button>
                </form>
                <p className="text-xs text-primary-foreground/70">
                  Or email{" "}
                  <a href="mailto:betoiii@gmail.com" className="underline underline-offset-2">
                    betoiii@gmail.com
                  </a>{" "}
                  to talk directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-8 bg-gray-50 border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="flex justify-center">
              <Button asChild variant="ghost" className="text-sm text-gray-500 hover:text-primary hover:bg-transparent">
                <a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/try-it-now`}>Try It Now</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t bg-background py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Atlas Data Co-op. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="#" className="underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="underline underline-offset-4">
              Privacy
            </Link>
            <Link href="#" className="underline underline-offset-4">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
