import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Scale, FileCheck, UserCheck, AlertOctagon, ExternalLink } from 'lucide-react';

export default function Compliance() {
  const [logoError, setLogoError] = React.useState(false);

  return (
    <div className="min-h-screen bg-secondary py-24 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <div className="inline-flex p-4 bg-primary/5 rounded-3xl mb-6">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-5xl font-serif italic text-primary mb-4">Legal & Compliance</h1>
          <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.3em]">
            Trust, Fair Redress & Regulatory Standards • 2026
          </p>
        </header>

        {/* Highlight Banner / Fast Facts */}
        <div className="bg-primary text-secondary p-8 rounded-[2rem] shadow-xl border border-[#d4af37]/30 mb-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <h3 className="text-accent text-xs font-black uppercase tracking-[0.2em]">Industry Trust Status</h3>
            <p className="text-xs text-secondary/70 leading-relaxed max-w-lg">
              House of Eden Property Management is fully integrated with the UK's leading industry trust frameworks, ensuring standard dispute handling and comprehensive indemnity protections.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right border-l border-white/10 pl-0 md:pl-8">
            <a 
              href="https://www.theprs.co.uk/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block hover:scale-[1.03] transition-transform"
            >
              {!logoError ? (
                <img 
                  src="property-redress-logo.jpeg" 
                  alt="Property Redress Scheme Member" 
                  style={{ height: '48px', width: 'auto', cursor: 'pointer', opacity: 0.9, transition: 'opacity 0.3s ease' }}
                  onError={() => setLogoError(true)}
                  referrerPolicy="no-referrer"
                  className="hover:opacity-100 transition-opacity"
                />
              ) : (
                <div style={{ height: '48px', width: 'auto' }} className="flex items-center gap-2">
                  <svg 
                    viewBox="0 0 320 100" 
                    style={{ height: '40px', width: 'auto', cursor: 'pointer' }} 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g>
                      <path d="M 8 85 L 48 15 L 56 15 L 16 85 Z" fill="#71717a" />
                      <rect x="22" y="38" width="13" height="47" rx="1.5" fill="#a855f7" />
                      <rect x="42" y="15" width="13" height="70" rx="1.5" fill="#d946ef" />
                    </g>
                    <text x="68" y="36" fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="300" letterSpacing="0.02em">Property</text>
                    <text x="68" y="67" fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="28" fontWeight="800" letterSpacing="0.01em">Redress</text>
                    <text x="68" y="88" fill="#d4af37" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" letterSpacing="0.18em">SCHEME</text>
                  </svg>
                </div>
              )}
            </a>
            <div className="text-[11px] leading-relaxed font-sans text-secondary/60">
              <p>PRS Member ID: <strong className="text-accent">PRS058192</strong></p>
              <p>Insured by: <strong className="text-secondary">Simply Business</strong></p>
              <p>Policy: <strong className="text-secondary/80">CHBS5558206XB</strong></p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl shadow-primary/5 space-y-16 text-primary border border-primary/5">
          
          {/* Section 1 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-accent pb-2 border-b border-primary/5">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-lg font-serif italic text-primary">1. Core Platform Provisions & Data Governance</h2>
            </div>
            <p className="text-xs text-primary/40 font-black uppercase tracking-[0.15em] mb-4">hoepropertymanagement.co.uk Portal Operations</p>
            
            <div className="space-y-6 pl-4 md:pl-6 border-l-2 border-accent/20">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Service Definition:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  The website acts as a digital intermediary platform, facilitating property marketing, document delivery, and communication between vetted landlords and prospective tenants.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Data Protection & GDPR:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  The platform processes personal data (identification, financial references) strictly in accordance with the Data Protection Act 2018. House of Eden is registered with the Information Commissioner’s Office (ICO).
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Platform Liability Limitation:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  The agency ensures reasonable platform uptime and security but is not liable for temporary service interruptions, third-party server outages, or delays in document transmission outside our direct technical control.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-accent pb-2 border-b border-primary/5">
              <Scale className="w-6 h-6" />
              <h2 className="text-lg font-serif italic text-primary">2. Industry Trust & Financial Protections</h2>
            </div>
            <p className="text-xs text-primary/40 font-black uppercase tracking-[0.15em] mb-4">Dispute resolution and consumer ombudsman protections</p>

            <div className="space-y-6 pl-4 md:pl-6 border-l-2 border-accent/20">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                  <span>Property Redress Scheme (PRS):</span>
                </h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  The PRS is a government-authorized consumer ombudsman. It provides an independent, impartial dispute resolution service.
                </p>
                <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                  <p className="text-xs leading-relaxed text-primary/80">
                    <strong className="text-accent uppercase tracking-wider text-[10px] block mb-1">Credibility Lock:</strong>
                    If a landlord or tenant exhausts the internal House of Eden complaints procedure without satisfaction, the PRS holds the legal authority to investigate and enforce binding financial compensation against the agency. This guarantees fair treatment for all users.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary">Simply Business Insurance Policy:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/[0.02] border border-primary/5 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Professional Indemnity (PI)</h4>
                    <p className="text-xs leading-relaxed text-primary/70">
                      Protects the agency, landlords, and tenants against financial loss arising from alleged negligence, errors, or omissions in professional services (e.g., contract drafting errors or mishandled compliance documents).
                    </p>
                  </div>
                  <div className="p-4 bg-primary/[0.02] border border-primary/5 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Public Liability (PL)</h4>
                    <p className="text-xs leading-relaxed text-primary/70">
                      Covers the agency for legal costs and compensation claims if a third party suffers injury or property damage directly related to House of Eden’s business operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-accent pb-2 border-b border-primary/5">
              <FileCheck className="w-6 h-6" />
              <h2 className="text-lg font-serif italic text-primary">3. Landlord Compliance & Listing Regulations</h2>
            </div>
            <p className="text-xs text-primary/40 font-black uppercase tracking-[0.15em] mb-4">Statutory safety and marketing obligations for landlords</p>

            <div className="space-y-6 pl-4 md:pl-6 border-l-2 border-accent/20">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Truthful Representation:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  Under the Consumer Protection from Unfair Trading Regulations 2008, all uploaded photos, floor plans, and descriptions must be 100% accurate. Misleading omissions are strictly prohibited.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Mandatory Safety Certification:</h3>
                <p className="text-sm leading-relaxed text-primary/70 mb-2">
                  Landlords must physically possess and be prepared to upload valid copies of:
                </p>
                <ul className="list-disc pl-5 text-sm text-primary/70 space-y-1">
                  <li>An Energy Performance Certificate (EPC) with a minimum rating of ‘E’.</li>
                  <li>A current Gas Safety Certificate (if gas is installed).</li>
                  <li>An Electrical Installation Condition Report (EICR).</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">The Tenant Fees Act 2019:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  Landlords are legally prohibited from attempting to charge tenants administration, referencing, or inventory fees through the platform.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Legal Right to Let:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  Landlords must possess the freehold or explicit leasehold permission, and applicable HMO (House in Multiple Occupation) licenses from the local council, before listing a property.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-accent pb-2 border-b border-primary/5">
              <UserCheck className="w-6 h-6" />
              <h2 className="text-lg font-serif italic text-primary">4. Tenant Rights & Platform Obligations</h2>
            </div>
            <p className="text-xs text-primary/40 font-black uppercase tracking-[0.15em] mb-4">Statutory tenant guarantees & legal expectations</p>

            <div className="space-y-6 pl-4 md:pl-6 border-l-2 border-accent/20">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Fee Transparency:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  In strict compliance with the Tenant Fees Act 2019, tenants will not be charged any hidden platform fees, viewing fees, or referencing charges by House of Eden.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Right to Rent Compliance:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  Tenants acknowledge that using the platform to apply for a tenancy requires them to submit to mandatory UK Government "Right to Rent" immigration checks.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Financial Accuracy:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  Tenants must provide factual, unmanipulated financial and employment data during the referencing phase. Falsifying documents constitutes fraud by false representation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-accent pb-2 border-b border-primary/5">
              <AlertOctagon className="w-6 h-6" />
              <h2 className="text-lg font-serif italic text-primary">5. Agency Legal Actions & Enforcement</h2>
            </div>
            <p className="text-xs text-primary/40 font-black uppercase tracking-[0.15em] mb-4">Procedures for statutory violations and bad actors</p>

            <div className="space-y-6 pl-4 md:pl-6 border-l-2 border-accent/20">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Content Takedown Rights:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  The agency reserves the immediate right to unpublish, suspend, or permanently delete any property listing that fails to meet statutory safety standards or violates the Consumer Protection Regulations.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Account Termination:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  We maintain the right to suspend or terminate the portal access of any landlord or tenant found to be submitting fraudulent documents, engaging in discriminatory practices, or circumventing platform communication protocols.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary">Reporting to Authorities:</h3>
                <p className="text-sm leading-relaxed text-primary/70">
                  In cases of suspected fraud, illegal subletting, or failure to secure mandatory licensing (e.g., HMO evasion), House of Eden reserves the right to report the user and provide digital portal evidence to local authorities, Trading Standards, or law enforcement.
                </p>
              </div>
            </div>
          </section>

          {/* Footer of card */}
          <div className="pt-12 border-t border-primary/5 text-center">
            <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1">ICO Registration Details</p>
            <p className="text-[9px] text-primary/30 uppercase tracking-[0.3em] font-black">Registered Agent: House of Eden Ltd • Ref: HOE-EST-2026-XQ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
