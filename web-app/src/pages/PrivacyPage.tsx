import React from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Shield, Eye, Lock, Users, Mail, Calendar } from 'lucide-react'

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
            <Shield className="text-white mr-3" size={32} />
            Privacy Policy
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your personal information.
          </p>
          <p className="text-sm text-white/60 mt-2">Last updated: July 2025</p>
        </div>

        <div className="space-y-6">
          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Eye className="text-primary-600 mr-2" size={20} />
                Information We Collect
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Personal Information
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Name and email address when you create an account</li>
                    <li>
                      Profile information including bio, location, and avatar
                    </li>
                    <li>
                      Payment information (Revolut tags, bank account details)
                      for event payments
                    </li>
                    <li>Skill levels and sports preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Activity Information
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Events you create, join, or save</li>
                    <li>Karma points and feedback from other users</li>
                    <li>Messages and communications within the platform</li>
                    <li>Location data when you use location-based features</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Technical Information
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Device information and browser type</li>
                    <li>IP address and general location</li>
                    <li>Usage patterns and preferences</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="text-primary-600 mr-2" size={20} />
                How We Use Your Information
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Provide Services:</strong> Create and manage your
                    account, facilitate event creation and participation,
                    process payments
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Communication:</strong> Send notifications about
                    events, karma updates, and important platform announcements
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Safety & Security:</strong> Verify user identity,
                    prevent fraud, and maintain community standards
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Improve Platform:</strong> Analyze usage patterns to
                    enhance features and user experience
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Legal Compliance:</strong> Comply with applicable
                    laws and respond to legal requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Lock className="text-primary-600 mr-2" size={20} />
                Information Sharing
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    With Other Users
                  </h3>
                  <p className="text-gray-700">
                    Your profile information, karma points, and event
                    participation are visible to other users to facilitate
                    community interaction and trust.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    With Service Providers
                  </h3>
                  <p className="text-gray-700">
                    We share information with trusted third parties who help us
                    operate the platform, such as payment processors, hosting
                    providers, and analytics services.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Legal Requirements
                  </h3>
                  <p className="text-gray-700">
                    We may disclose information when required by law, to protect
                    our rights, or to ensure user safety.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>We never sell your personal information</strong> to
                    third parties for marketing purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Shield className="text-primary-600 mr-2" size={20} />
                Data Security
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  We implement appropriate technical and organizational measures
                  to protect your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication measures</li>
                  <li>Secure payment processing through trusted providers</li>
                  <li>Regular backups and disaster recovery procedures</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    While we strive to protect your information, no method of
                    transmission over the internet is 100% secure. Please use
                    strong passwords and keep your account credentials
                    confidential.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="text-primary-600 mr-2" size={20} />
                Your Rights
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700 mb-4">
                  Under GDPR and other applicable privacy laws, you have the
                  following rights:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Access</h4>
                      <p className="text-sm text-gray-600">
                        Request a copy of your personal data
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Rectification
                      </h4>
                      <p className="text-sm text-gray-600">
                        Correct inaccurate information
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Erasure</h4>
                      <p className="text-sm text-gray-600">
                        Request deletion of your data
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Portability</h4>
                      <p className="text-sm text-gray-600">
                        Export your data in a readable format
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Restriction</h4>
                      <p className="text-sm text-gray-600">
                        Limit how we process your data
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Objection</h4>
                      <p className="text-sm text-gray-600">
                        Object to certain processing activities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Mail className="text-primary-600 mr-2" size={20} />
                Contact Us
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  If you have questions about this Privacy Policy or want to
                  exercise your rights, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <strong>Email:</strong> info@hraj.eu
                    </p>
                    <p className="text-gray-700">
                      <strong>Data Protection Officer:</strong> capajj@gmail.com
                    </p>
                    <p className="text-gray-700">
                      <strong>Response Time:</strong> We will respond to your
                      request within 30 days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="text-primary-600 mr-2" size={20} />
                Policy Updates
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. When we
                make significant changes, we will notify you by email or through
                a prominent notice on our platform. Your continued use of
                hraj.eu after such modifications constitutes acceptance of the
                updated Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
