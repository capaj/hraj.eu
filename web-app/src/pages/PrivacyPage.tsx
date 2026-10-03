import { Trans } from '@lingui/react/macro'
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
            <Trans>Privacy Policy</Trans>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            <Trans>Your privacy is important to us. This policy explains how we
            collect, use, and protect your personal information.</Trans>
          </p>
          <p className="text-sm text-white/60 mt-2"><Trans>Last updated: July 2025</Trans></p>
        </div>

        <div className="space-y-6">
          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Eye className="text-primary-600 mr-2" size={20} />
                <Trans>Information We Collect</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Personal Information</Trans>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><Trans>Name and email address when you create an account</Trans></li>
                    <li>
                      <Trans>Profile information including bio, location, and avatar</Trans>
                    </li>
                    <li>
                      <Trans>Payment information (Revolut tags, bank account details)
                      for event payments</Trans>
                    </li>
                    <li><Trans>Skill levels and sports preferences</Trans></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Activity Information</Trans>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><Trans>Events you create, join, or save</Trans></li>
                    <li><Trans>Karma points and feedback from other users</Trans></li>
                    <li><Trans>Messages and communications within the platform</Trans></li>
                    <li><Trans>Location data when you use location-based features</Trans></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Technical Information</Trans>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><Trans>Device information and browser type</Trans></li>
                    <li><Trans>IP address and general location</Trans></li>
                    <li><Trans>Usage patterns and preferences</Trans></li>
                    <li><Trans>Cookies and similar tracking technologies</Trans></li>
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
                <Trans>How We Use Your Information</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <Trans><strong>Provide Services:</strong> Create and manage your
                    account, facilitate event creation and participation,
                    process payments</Trans>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <Trans><strong>Communication:</strong> Send notifications about
                    events, karma updates, and important platform announcements</Trans>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <Trans><strong>Safety & Security:</strong> Verify user identity,
                    prevent fraud, and maintain community standards</Trans>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <Trans><strong>Improve Platform:</strong> Analyze usage patterns to
                    enhance features and user experience</Trans>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <Trans><strong>Legal Compliance:</strong> Comply with applicable
                    laws and respond to legal requests</Trans>
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
                <Trans>Information Sharing</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>With Other Users</Trans>
                  </h3>
                  <p className="text-gray-700">
                    <Trans>Your profile information, karma points, and event
                    participation are visible to other users to facilitate
                    community interaction and trust.</Trans>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>With Service Providers</Trans>
                  </h3>
                  <p className="text-gray-700">
                    <Trans>We share information with trusted third parties who help us
                    operate the platform, such as payment processors, hosting
                    providers, and analytics services.</Trans>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Legal Requirements</Trans>
                  </h3>
                  <p className="text-gray-700">
                    <Trans>We may disclose information when required by law, to protect
                    our rights, or to ensure user safety.</Trans>
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <Trans><strong>We never sell your personal information</strong> to
                    third parties for marketing purposes.</Trans>
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
                <Trans>Data Security</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  <Trans>We implement appropriate technical and organizational measures
                  to protect your personal information:</Trans>
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li><Trans>Encryption of data in transit and at rest</Trans></li>
                  <li><Trans>Regular security assessments and updates</Trans></li>
                  <li><Trans>Access controls and authentication measures</Trans></li>
                  <li><Trans>Secure payment processing through trusted providers</Trans></li>
                  <li><Trans>Regular backups and disaster recovery procedures</Trans></li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <Trans>While we strive to protect your information, no method of
                    transmission over the internet is 100% secure. Please use
                    strong passwords and keep your account credentials
                    confidential.</Trans>
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
                <Trans>Your Rights</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700 mb-4">
                  <Trans>Under GDPR and other applicable privacy laws, you have the
                  following rights:</Trans>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900"><Trans>Access</Trans></h4>
                      <p className="text-sm text-gray-600">
                        <Trans>Request a copy of your personal data</Trans>
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        <Trans>Rectification</Trans>
                      </h4>
                      <p className="text-sm text-gray-600">
                        <Trans>Correct inaccurate information</Trans>
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900"><Trans>Erasure</Trans></h4>
                      <p className="text-sm text-gray-600">
                        <Trans>Request deletion of your data</Trans>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900"><Trans>Portability</Trans></h4>
                      <p className="text-sm text-gray-600">
                        <Trans>Export your data in a readable format</Trans>
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900"><Trans>Restriction</Trans></h4>
                      <p className="text-sm text-gray-600">
                        <Trans>Limit how we process your data</Trans>
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900"><Trans>Objection</Trans></h4>
                      <p className="text-sm text-gray-600">
                        <Trans>Object to certain processing activities</Trans>
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
                <Trans>Contact Us</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  <Trans>If you have questions about this Privacy Policy or want to
                  exercise your rights, please contact us:</Trans>
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <Trans><strong>Email:</strong> info@hraj.eu</Trans>
                    </p>
                    <p className="text-gray-700">
                      <Trans><strong>Data Protection Officer:</strong> capajj@gmail.com</Trans>
                    </p>
                    <p className="text-gray-700">
                      <Trans><strong>Response Time:</strong> We will respond to your
                      request within 30 days</Trans>
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
                <Trans>Policy Updates</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">
                <Trans>We may update this Privacy Policy from time to time. When we
                make significant changes, we will notify you by email or through
                a prominent notice on our platform. Your continued use of
                hraj.eu after such modifications constitutes acceptance of the
                updated Privacy Policy.</Trans>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
