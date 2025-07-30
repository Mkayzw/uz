import Link from 'next/link'

export default function MerchantAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-500">
                UniStay
              </span>
            </Link>
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              UNISTAY MERCHANT AGREEMENT
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Effective Date: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                This Merchant Agreement ("Agreement") is entered into by and between Unistay ("Platform", "we", "our", or "us"), 
                the operator of a student accommodation booking web platform, and you ("User") who accesses the platform either 
                as an Agent or Tenant.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 font-semibold">
                By using Unistay, you agree to the following terms and conditions:
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. DEFINITIONS</h2>
              <div className="space-y-4">
                <div>
                  <strong className="text-gray-900 dark:text-white">Agent:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">
                    An individual or business listing rental properties on Unistay for student accommodation.
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Tenant:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">
                    A verified student from the University of Zimbabwe who uses the platform to find and book accommodation.
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Listing Fee:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">
                    A non-refundable, once-off fee paid by Agents to publish property listings.
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Platform:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">
                    The Unistay web-based application.
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">User:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">
                    Any individual using the Platform, including Agents and Tenants.
                  </span>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. PLATFORM USE</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Access to Unistay is restricted to registered University of Zimbabwe students and approved Agents.</li>
                <li>Agents are responsible for the accuracy of all property details submitted.</li>
                <li>Tenants are responsible for verifying property suitability before committing to a booking.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. AGENT TERMS</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Agents must pay a non-refundable once-off listing fee per property. Fee amounts are displayed on the platform and are subject to change.</li>
                <li>Upon payment, the Agent may publish one or more listings as per the plan selected.</li>
                <li>Agents must provide accurate and truthful descriptions, images, and contact details.</li>
                <li>Agents are solely responsible for managing bookings, collecting rent and agent fees from Tenants.</li>
                <li>Fraudulent listings will result in immediate removal without refund and possible blacklisting.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. TENANT TERMS</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Only verified UZ students may use Unistay to book accommodation.</li>
                <li>Tenants are expected to contact Agents directly through provided information to finalize bookings.</li>
                <li>All payments (including rent and agent fees) are made directly to the Agent via EcoCash or other offline methods. Unistay does not process payments on behalf of Agents.</li>
                <li>Tenants are encouraged to verify listings in person before making payments.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. PAYMENTS & FEES</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Unistay collects listing fees from Agents only.</li>
                <li>Unistay does not charge tenants any platform usage fees.</li>
                <li>All rent, deposits, and agent-related payments are transacted outside the Platform between Tenant and Agent.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. DISCLAIMERS & LIABILITY</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Unistay acts only as a facilitator of listings and does not own, manage, or control the properties listed.</li>
                <li>We do not guarantee the quality, safety, legality, or availability of any accommodation.</li>
                <li>We do not offer refunds, nor do we mediate disputes between Agents and Tenants.</li>
                <li>While we do our best to ensure a safe and trusted environment, Unistay assumes no liability for any damages, loss, or fraud resulting from platform use.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. CODE OF CONDUCT</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Misuse of the platform, posting fraudulent listings, impersonation, or harassment will result in immediate suspension or banning from Unistay.</li>
                <li>Agents and Tenants must maintain respectful communication at all times.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. TERMINATION</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Unistay reserves the right to terminate access for any User violating this Agreement or engaging in conduct deemed harmful to the Platform or its Users.</li>
                <li>Listings may be removed without notice if they violate platform rules or contain misleading content.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. GOVERNING LAW</h2>
              <p className="text-gray-700 dark:text-gray-300">
                This Agreement shall be governed by the laws of Zimbabwe. Any legal disputes must be resolved under the jurisdiction of Zimbabwean courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. CONTACT</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For technical issues or general platform feedback:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  📧 <a href="mailto:support@unistay.co.zw" className="text-blue-600 dark:text-blue-400 hover:underline">support@unistay.co.zw</a>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  📍 Harare, Zimbabwe
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ACCEPTANCE</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  By using Unistay, you confirm that you've read, understood, and agreed to this Merchant Agreement.
                </p>
              </div>
            </section>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
