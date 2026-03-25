'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { analyzeSystemDesign } from '@/actions/orchestrate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronRight, Copy, Check, Github } from 'lucide-react';

const formSchema = z.object({
  systemDesign: z.string().min(10, {
    message: 'Please enter a system design specification (at least 10 characters).',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemDesign: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeSystemDesign(values.systemDesign);
      setResult(response.result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze system design';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-red-50/30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-100/20 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-50/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-100/10 rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Lamatic Logo */}
            <svg width="133" height="24" viewBox="0 0 133 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
              <g clipPath="url(#clip0_675_1373)">
                <path d="M17.9598 0H5.04027C4.74507 0 4.50577 0.238941 4.50577 0.533689V4.09873C4.50577 4.31979 4.3263 4.49899 4.1049 4.49899H0.534492C0.239301 4.49899 0 4.73794 0 5.03269V17.9328C0 18.2158 0.112625 18.4874 0.313098 18.6875L5.32046 23.6874C5.52093 23.8875 5.79283 24 6.07634 24H18.9958C19.2911 24 19.5304 23.761 19.5304 23.4663V19.9013C19.5304 19.6802 19.7099 19.501 19.9312 19.501H23.5017C23.7968 19.501 24.0361 19.2621 24.0361 18.9673V6.06721C24.0361 5.78412 23.9235 5.51263 23.723 5.31246L18.7157 0.312627C18.5152 0.112454 18.2433 0 17.9598 0ZM7.35577 19.3449L4.66249 16.658C4.56215 16.5579 4.50577 16.4221 4.50577 16.2805V4.89926C4.50577 4.6782 4.68525 4.49899 4.90664 4.49899H16.305C16.4468 4.49899 16.5829 4.55529 16.6831 4.65548L19.374 7.34471C19.4742 7.44478 19.5304 7.58046 19.5304 7.72192V19.1007C19.5304 19.3218 19.3509 19.501 19.1295 19.501H7.73355C7.59187 19.501 7.456 19.4449 7.35577 19.3449Z" fill="black"></path>
                <path d="M11.8074 7.97772L8.15655 11.6231C7.94782 11.8316 7.94782 12.1695 8.15655 12.3779L11.8074 16.0234C12.0162 16.2318 12.3547 16.2318 12.5634 16.0234L16.2143 12.3779C16.423 12.1695 16.423 11.8316 16.2143 11.6231L12.5634 7.97772C12.3547 7.76931 12.0162 7.76931 11.8074 7.97772Z" fill="#F33736"></path>
                <path d="M129.188 3.73633H133.305V6.78091H129.188V3.73633ZM129.344 8.06986H133.149V19.4482H129.344V8.06986Z" fill="black"></path>
                <path d="M127.731 12.2037V19.4485H123.926V11.6037C123.926 11.3814 123.851 11.174 123.703 10.9814C123.569 10.7888 123.384 10.6406 123.147 10.537C122.924 10.4184 122.672 10.3592 122.39 10.3592C121.366 10.3592 120.803 10.7888 120.698 11.6481H116.804C116.863 10.8629 117.13 10.174 117.605 9.58136C118.095 8.98872 118.748 8.52944 119.563 8.20352C120.38 7.87757 121.315 7.7146 122.367 7.7146C123.451 7.7146 124.393 7.9072 125.194 8.2924C125.995 8.6628 126.619 9.18136 127.064 9.848C127.509 10.5147 127.731 11.2999 127.731 12.2037ZM124.549 15.3594C124.549 16.2631 124.378 17.041 124.037 17.6929C123.71 18.3447 123.243 18.8485 122.635 19.204C122.041 19.5596 121.336 19.7374 120.521 19.7374C119.793 19.7374 119.14 19.5818 118.562 19.2707C117.998 18.9447 117.546 18.5077 117.204 17.9595C116.877 17.4114 116.715 16.7891 116.715 16.0928C116.715 14.9816 117.011 14.1297 117.605 13.5371C118.213 12.9445 119.11 12.6111 120.298 12.537L123.036 12.3815C123.362 12.3518 123.592 12.2852 123.725 12.1814C123.859 12.063 123.926 11.8852 123.926 11.6481L123.948 14.715L121.722 14.8038C121.336 14.8334 121.04 14.9372 120.832 15.115C120.639 15.2927 120.543 15.5372 120.543 15.8483C120.543 16.1742 120.676 16.441 120.944 16.6483C121.21 16.841 121.566 16.9373 122.012 16.9373C122.367 16.9373 122.687 16.8632 122.968 16.715C123.266 16.5521 123.495 16.3372 123.659 16.0706C123.837 15.8038 123.926 15.5002 123.926 15.1594L124.549 15.3594Z" fill="black"></path>
                <path d="M114.012 16L115.712 17.697L114.012 19.3941L112.312 17.697L114.012 16Z" fill="#F33736"></path>
                <path d="M98.9531 13.7149C98.9531 12.5 99.1975 11.4407 99.6878 10.537C100.192 9.61842 100.882 8.91466 101.757 8.42578C102.647 7.92203 103.687 7.67017 104.873 7.67017C105.941 7.67017 106.899 7.87017 107.745 8.27018C108.59 8.67018 109.265 9.24802 109.769 10.0036C110.289 10.7592 110.579 11.6778 110.638 12.7593H106.787C106.773 12.0926 106.594 11.6111 106.253 11.3147C105.912 11.0185 105.452 10.8703 104.873 10.8703C104.443 10.8703 104.072 10.9815 103.76 11.2037C103.449 11.4259 103.212 11.7519 103.048 12.1815C102.885 12.5963 102.804 13.1075 102.804 13.7149C102.804 14.6335 102.982 15.3446 103.337 15.8483C103.708 16.352 104.22 16.6039 104.873 16.6039C105.437 16.6039 105.89 16.478 106.231 16.2261C106.587 15.9595 106.773 15.5224 106.787 14.915H110.638C110.504 16.4854 109.91 17.6928 108.858 18.5374C107.804 19.3819 106.476 19.8041 104.873 19.8041C103.687 19.8041 102.647 19.5522 101.757 19.0485C100.882 18.5447 100.192 17.8336 99.6878 16.9151C99.1975 15.9965 98.9531 14.9298 98.9531 13.7149Z" fill="black"></path>
                <path d="M93.6445 3.73633H97.7619V6.78091H93.6445V3.73633ZM93.8 8.06986H97.6065V19.4482H93.8V8.06986Z" fill="black"></path>
                <path d="M85.4414 8.07018H92.6747V11.0703H85.4414V8.07018ZM92.6747 16.2706V19.4485H91.3166C90.4714 19.4485 89.7367 19.3078 89.1133 19.0263C88.4908 18.7299 88.0005 18.3003 87.6447 17.7373C87.3034 17.1595 87.1327 16.4558 87.1327 15.6261V5.1145H90.9385V15.115C90.9385 15.5298 91.0202 15.8261 91.1836 16.0039C91.3471 16.1817 91.5915 16.2706 91.9183 16.2706H92.6747Z" fill="black"></path>
                <path d="M84.5641 12.2037V19.4485H80.758V11.6037C80.758 11.3814 80.6838 11.174 80.5355 10.9814C80.4019 10.7888 80.2164 10.6406 79.979 10.537C79.7565 10.4184 79.5042 10.3592 79.2223 10.3592C78.1985 10.3592 77.6347 10.7888 77.5308 11.6481H73.6359C73.6953 10.8629 73.9623 10.174 74.4371 9.58136C74.9268 8.98872 75.5796 8.52944 76.3957 8.20352C77.2118 7.87757 78.1466 7.7146 79.2001 7.7146C80.2832 7.7146 81.2255 7.9072 82.0267 8.2924C82.8279 8.6628 83.4512 9.18136 83.8959 9.848C84.3413 10.5147 84.5641 11.2999 84.5641 12.2037ZM81.3809 15.3594C81.3809 16.2631 81.2102 17.041 80.8693 17.6929C80.5429 18.3447 80.0755 18.8485 79.4671 19.204C78.8736 19.5596 78.1689 19.7374 77.3528 19.7374C76.6257 19.7374 75.9728 19.5818 75.3941 19.2707C74.8303 18.9447 74.3778 18.5077 74.0365 17.9595C73.7101 17.4114 73.5469 16.7891 73.5469 16.0928C73.5469 14.9816 73.8436 14.1297 74.4371 13.5371C75.0455 12.9445 75.9432 12.6111 77.1302 12.537L79.8677 12.3815C80.1942 12.3518 80.4242 12.2852 80.5577 12.1814C80.6913 12.063 80.758 11.8852 80.758 11.6481L80.7803 14.715L78.5546 14.8038C78.1689 14.8334 77.8721 14.9372 77.6644 15.115C77.4714 15.2927 77.375 15.5372 77.375 15.8483C77.375 16.1742 77.5085 16.441 77.7756 16.6483C78.0427 16.841 78.3988 16.9373 78.844 16.9373C79.2001 16.9373 79.5191 16.8632 79.801 16.715C80.0978 16.5521 80.3277 16.3372 80.4909 16.0706C80.669 15.8038 80.758 15.5002 80.758 15.1594L81.3809 15.3594Z" fill="black"></path>
                <path d="M68.3943 13.1593C68.3943 12.4334 68.2385 11.9074 67.9269 11.5815C67.6153 11.2407 67.1998 11.0703 66.6805 11.0703C66.3689 11.0703 66.087 11.1518 65.8348 11.3147C65.5825 11.4778 65.3822 11.7074 65.2338 12.0037C65.1003 12.3 65.0335 12.6334 65.0335 13.0038L64.1877 12.8704C64.1877 11.7889 64.3881 10.8629 64.7887 10.0925C65.2042 9.3073 65.7235 8.70722 66.3467 8.29242C66.9847 7.87758 67.6227 7.67017 68.2608 7.67017C69.0175 7.67017 69.6926 7.85536 70.2861 8.22578C70.8797 8.5813 71.3396 9.1073 71.666 9.80362C72.0073 10.4999 72.1779 11.3518 72.1779 12.3593V19.4485H68.3943V13.1593ZM61.2499 13.1593C61.2499 12.4334 61.0941 11.9074 60.7825 11.5815C60.4857 11.2407 60.0776 11.0703 59.5584 11.0703C59.2468 11.0703 58.9649 11.1518 58.7126 11.3147C58.4603 11.4778 58.26 11.7074 58.1117 12.0037C57.9781 12.3 57.9114 12.6334 57.9114 13.0038L57.0656 12.8704C57.0656 11.7889 57.2659 10.8629 57.6665 10.0925C58.082 9.3073 58.6013 8.70722 59.2245 8.29242C59.8477 7.87758 60.4857 7.67017 61.1386 7.67017C61.8953 7.67017 62.563 7.85536 63.1417 8.22578C63.7352 8.5813 64.1952 9.1073 64.5216 9.80362C64.8628 10.4999 65.0335 11.3518 65.0335 12.3593V19.4485H61.2499V13.1593ZM54.1055 8.07018H57.9114V19.4485H54.1055V8.07018Z" fill="black"></path>
                <path d="M52.4898 12.2037V19.4485H48.6838V11.6037C48.6838 11.3814 48.6096 11.174 48.4612 10.9814C48.3278 10.7888 48.1423 10.6406 47.9049 10.537C47.6823 10.4184 47.43 10.3592 47.1481 10.3592C46.1243 10.3592 45.5605 10.7888 45.4566 11.6481H41.5617C41.621 10.8629 41.8881 10.174 42.363 9.58136C42.8526 8.98872 43.5055 8.52944 44.3215 8.20352C45.1376 7.87757 46.0724 7.7146 47.1259 7.7146C48.209 7.7146 49.1512 7.9072 49.9524 8.2924C50.7537 8.6628 51.3769 9.18136 51.8221 9.848C52.2672 10.5147 52.4898 11.2999 52.4898 12.2037ZM49.307 15.3594C49.307 16.2631 49.1364 17.041 48.7951 17.6929C48.4687 18.3447 48.0013 18.8485 47.3929 19.204C46.7995 19.5596 46.0946 19.7374 45.2785 19.7374C44.5515 19.7374 43.8986 19.5818 43.32 19.2707C42.7561 18.9447 42.3036 18.5077 41.9623 17.9595C41.6359 17.4114 41.4727 16.7891 41.4727 16.0928C41.4727 14.9816 41.7694 14.1297 42.363 13.5371C42.9713 12.9445 43.869 12.6111 45.056 12.537L47.7936 12.3815C48.12 12.3518 48.35 12.2852 48.4835 12.1814C48.6171 12.063 48.6838 11.8852 48.6838 11.6481L48.7061 14.715L46.4804 14.8038C46.0946 14.8334 45.7979 14.9372 45.5901 15.115C45.3973 15.2927 45.3008 15.5372 45.3008 15.8483C45.3008 16.1742 45.4344 16.441 45.7014 16.6483C45.9685 16.841 46.3246 16.9373 46.7697 16.9373C47.1259 16.9373 47.4449 16.8632 47.7268 16.715C48.0235 16.5521 48.2536 16.3372 48.4168 16.0706C48.5948 15.8038 48.6838 15.5002 48.6838 15.1594L49.307 15.3594Z" fill="black"></path>
                <path d="M40.9481 19.4482H31.3555V4.64746H35.1614V15.8924H40.9481V19.4482Z" fill="black"></path>
              </g>
              <defs>
                <clipPath id="clip0_675_1373">
                  <rect width="133" height="24" fill="white"></rect>
                </clipPath>
              </defs>
            </svg>
          </div>
          <a
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-red-600 text-white transition-all duration-300 font-medium text-sm group"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4 text-black">
              Analyze Your
              <br />
              <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                System Design
              </span>
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Get AI-powered insights for your system architecture. Enter your design specification and receive comprehensive analysis powered by Lamatic.
            </p>
          </div>

          {/* Form Section */}
          <Card className="border-gray-200/50 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-200/50">
              <CardTitle className="text-2xl text-black">System Design Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-3">
                    Describe your system architecture
                  </label>
                  <Textarea
                    placeholder="e.g., Design a scalable social media platform with 1M concurrent users, real-time notifications, and content delivery..."
                    className="resize-none bg-white border-2 border-gray-200 text-black placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600 rounded-xl h-32"
                    {...form.register('systemDesign')}
                  />
                  {form.formState.errors.systemDesign && (
                    <p className="text-sm text-red-600 mt-2 font-medium">
                      {form.formState.errors.systemDesign.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Design...
                    </>
                  ) : (
                    <>
                      Analyze Design
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {error && (
                  <div className="bg-red-50/80 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Result Section */}
          {result && (
            <Card className="mt-8 border-gray-200/50 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-200/50">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-2xl text-black">Analysis Results</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-2 border-gray-200 text-black hover:bg-red-50 hover:text-red-600 rounded-lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="whitespace-pre-wrap text-black bg-gray-50/50 p-6 rounded-xl border border-gray-200 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
                  {result}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResult(null);
                    form.reset();
                  }}
                  className="w-full mt-4 border-gray-200 text-black hover:bg-gray-100 rounded-lg font-medium"
                >
                  Analyze Another Design
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Examples */}
          {!result && (
            <div className="mt-12">
              <h3 className="text-center text-lg font-bold text-black mb-6">Try These Examples</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Design a distributed cache system like Redis with 100K QPS',
                  'Build a real-time collaboration tool with millions of concurrent users',
                  'Create a machine learning platform for training models at scale',
                  'Design a global CDN for low-latency content delivery',
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => form.setValue('systemDesign', example)}
                    className="text-left p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50/30 transition-all duration-300 group"
                  >
                    <p className="text-sm text-black font-medium group-hover:text-red-600">
                      {example}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 mt-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-gray-600 text-sm">
          <p>© 2024 Lamatic. Powered by AgentKit. Built with ❤️ for system designers.</p>
        </div>
      </footer>
    </div>
  );
}
