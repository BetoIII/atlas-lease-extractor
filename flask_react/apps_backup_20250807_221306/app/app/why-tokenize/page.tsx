import Link from "next/link"
import { Button, Card, CardContent } from "@/components/ui"
import { Shield, Lock, FileText, Database, CheckCircle, Key, FileJson } from "lucide-react"
import { Navbar } from "../../components/navbar"

export default function WhyTokenizePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Why Tokenize Lease & Appraisal Data?
                </h1>
                <p className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  <em>A technical overview of Atlas's approach to trusted document abstraction</em>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Tokenization = Verifiable, Portable, Immutable Trust
                </h2>
                <p className="text-gray-500 md:text-xl">
                  Every document abstracted through Atlas — a lease, rent roll, or appraisal — can be optionally
                  tokenized to create a cryptographically anchored metadata record.
                </p>
                <p className="text-gray-500 md:text-xl">This isn't crypto hype. It's practical infrastructure for:</p>
                <ul className="space-y-2 text-gray-500 md:text-lg">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Proving who created the data</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Showing when and how it was verified</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Enforcing permissioned access and audit trails</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Allowing downstream stakeholders to trust the output without trusting the process</span>
                  </li>
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] h-[300px] rounded-lg border bg-background p-6 shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      <div className="absolute inset-0 rounded-full border-4 border-dashed border-gray-200 animate-spin-slow"></div>
                      <div className="absolute inset-4 rounded-full border-2 border-primary bg-white flex items-center justify-center">
                        <Key className="h-16 w-16 text-primary" />
                      </div>
                      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-12 w-12 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute bottom-0 left-0 -ml-4 -mb-4 h-12 w-12 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute bottom-0 right-0 -mr-4 -mb-4 h-12 w-12 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Why It Matters</h2>
                <p className="text-gray-500 md:text-xl">Real estate professionals increasingly face:</p>
                <ul className="space-y-2 text-gray-500 md:text-lg">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Regulatory requirements (ASC 842, FIRREA)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Legal scrutiny (valuations challenged in court)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Internal review pressure (institutional clients, banks, partnerships)</span>
                  </li>
                </ul>
                <p className="text-gray-500 md:text-xl font-medium mt-6">
                  Tokenizing key documents gives your firm a defensible way to show:
                  <br />
                  "This lease was reviewed. These terms are accurate. We stand behind them."
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[500px]">
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-bold">Regulatory Compliance</h3>
                        <p className="text-sm text-gray-500">
                          Meet ASC 842 and FIRREA requirements with verifiable data
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-bold">Legal Protection</h3>
                        <p className="text-sm text-gray-500">Defend valuations with immutable proof of methodology</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Database className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-bold">Data Integrity</h3>
                        <p className="text-sm text-gray-500">Ensure data remains unchanged throughout its lifecycle</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Lock className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-bold">Access Control</h3>
                        <p className="text-sm text-gray-500">Manage permissions with cryptographic certainty</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">How It Works</h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl">
                  We tokenize only the metadata, not the raw lease or appraisal text.
                  <br />
                  The result is a portable, tamper-proof certificate of authorship and QA that travels with the
                  structured data.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-4xl">
              <div className="rounded-lg border bg-card p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <FileJson className="h-6 w-6 text-primary mr-2" />
                  <h3 className="text-xl font-bold">Example Token Schema</h3>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto text-sm">
                  {`{
  "document_type": "Appraisal Report",
  "token_id": "a6d29e7b-8345-4ec9-9c02-b79fe0231c5d",
  "issued_timestamp": "2025-04-10T21:17:00Z",
  "source_hash": "0x43adf7810ffb325b...9f78bca",
  "qa_verified": true,
  "qa_verifier_id": "QA-0192",
  "authors": [
    {
      "name": "Jane Smith, MAI",
      "license": "AG123456",
      "state": "CA",
      "role": "Primary Appraiser"
    },
    {
      "name": "David Lee",
      "license": "AG987654",
      "state": "CA",
      "role": "Co-Author"
    }
  ],
  "owning_firm": {
    "name": "Acme Valuation Group",
    "firm_id": "FIRM-0193"
  },
  "data_fields": {
    "term_start": "2023-07-01",
    "base_rent": "$48.00/SF",
    "tenant": "Starbucks Coffee",
    "use": "Retail"
  },
  "permissioning": {
    "visibility": "private",
    "allowed_viewers": ["internal", "qa_team"],
    "revocable": true
  },
  "blockchain_anchor": {
    "chain": "Ethereum",
    "tx_hash": "0x920ec...fa92d7",
    "explorer_url": "https://etherscan.io/tx/0x920ec..."
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  What Makes Our Approach Unique?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-2">
                        <Lock className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-bold">Private by default</h3>
                        <p className="text-sm text-gray-500">
                          Your data remains confidential with strict access controls
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-2">
                        <Database className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-bold">Chain-optional</h3>
                        <p className="text-sm text-gray-500">
                          Use blockchain only when needed for additional verification
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-2">
                        <FileText className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-bold">Audit-friendly</h3>
                        <p className="text-sm text-gray-500">
                          Designed for easy verification during regulatory reviews
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-2">
                        <FileJson className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-bold">Interoperable JSON format</h3>
                        <p className="text-sm text-gray-500">Easily integrate with existing systems and workflows</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] rounded-lg border bg-background p-6 shadow-lg">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">Document Uploaded</h3>
                        <p className="text-sm text-gray-500">Lease or appraisal document is processed</p>
                      </div>
                    </div>
                    <div className="h-8 border-l-2 border-dashed border-gray-300 ml-6"></div>
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                        <Database className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">Data Extracted</h3>
                        <p className="text-sm text-gray-500">AI extracts structured data with 98%+ accuracy</p>
                      </div>
                    </div>
                    <div className="h-8 border-l-2 border-dashed border-gray-300 ml-6"></div>
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                        <Key className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">Metadata Tokenized</h3>
                        <p className="text-sm text-gray-500">Cryptographic token created with verification data</p>
                      </div>
                    </div>
                    <div className="h-8 border-l-2 border-dashed border-gray-300 ml-6"></div>
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">Secure Distribution</h3>
                        <p className="text-sm text-gray-500">Data shared with controlled access and verification</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Try It?</h2>
                <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  You don't need to change your workflow — just upload a document and receive back clean, structured,
                  and optionally verifiable data.
                </p>
              </div>
              <div className="mt-6">
                <Button asChild size="lg" variant="secondary" className="px-8">
                  <Link href="#demo">Request a Demo</Link>
                </Button>
              </div>
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
