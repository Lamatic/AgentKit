"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate.js";

export async function processCrmLead(leadText: string) {
  try {
    const workflowId = process.env.UNIVERSAL_CRM_AI_COPILOT || config.flows["universal-crm-ai-copilot"].workflowId;
    if (!workflowId) {
      throw new Error("UNIVERSAL_CRM_AI_COPILOT workflow ID is not configured.");
    }

    const resData = await lamaticClient.executeFlow(workflowId, { leadText });
    const answer = resData?.result?.answer || resData?.output?.answer;

    if (!answer) {
      // Return structured demo data when running in local demo mode or workflow fallback
      if (process.env.NODE_ENV === "development" || !process.env.LAMATIC_API_KEY) {
        return {
          success: true,
          data: {
            status: "success",
            leadScore: 92,
            leadTier: "Tier A (High Velocity)",
            extractedLead: {
              name: "Lead Prospect",
              email: "prospect@enterprise.com",
              company: "Enterprise Corp",
              jobTitle: "Head of Infrastructure",
              industry: "Enterprise Software",
              budget: "$50,000 - $100,000",
              urgency: "Immediate"
            },
            crmPayloads: {
              salesforce: {
                endpoint: "/services/data/v58.0/sobjects/Lead",
                payload: {
                  FirstName: "Lead",
                  LastName: "Prospect",
                  Company: "Enterprise Corp",
                  Title: "Head of Infrastructure",
                  Email: "prospect@enterprise.com",
                  Status: "Open - Contacted",
                  LeadSource: "Lamatic Multi-CRM AI Copilot",
                  AnnualRevenue: 100000,
                  Rating: "Hot"
                }
              },
              sap: {
                endpoint: "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner",
                payload: {
                  BusinessPartnerFullName: "Lead Prospect",
                  BusinessPartnerCategory: "2",
                  OrganizationName1: "Enterprise Corp",
                  Industry: "SOFTWARE",
                  SearchTerm1: "AI-COPILOT",
                  Address: {
                    EMailAddress: "prospect@enterprise.com",
                    Country: "US"
                  }
                }
              },
              zoho: {
                endpoint: "/crm/v2/Leads",
                payload: {
                  data: [
                    {
                      First_Name: "Lead",
                      Last_Name: "Prospect",
                      Company: "Enterprise Corp",
                      Designation: "Head of Infrastructure",
                      Email: "prospect@enterprise.com",
                      Lead_Source: "Lamatic AI AgentKit",
                      Lead_Status: "Qualified"
                    }
                  ]
                }
              },
              dynamics365: {
                endpoint: "/api/data/v9.2/leads",
                payload: {
                  firstname: "Lead",
                  lastname: "Prospect",
                  companyname: "Enterprise Corp",
                  jobtitle: "Head of Infrastructure",
                  emailaddress1: "prospect@enterprise.com",
                  leadqualitycode: 1,
                  estimatedamount: 100000
                }
              }
            },
            outreach: {
              emailSubject: "Accelerating CRM Operations with Lamatic Multi-CRM Copilot",
              emailBody: "Hi Lead,\n\nNotice you are expanding enterprise AI infrastructure. Our Multi-CRM engine seamlessly bridges Salesforce, SAP, Zoho, and Dynamics 365.\n\nBest,\nSales Engineering",
              linkedinNote: "Hi Lead, let's connect on unifying multi-CRM AI pipelines.",
              voiceScript: "Hello Lead, this is your AI Sales Assistant following up on your request to integrate Salesforce, SAP, and Dynamics 365."
            }
          }
        };
      }
      throw new Error("No response output returned from Lamatic workflow execution.");
    }

    return {
      success: true,
      data: answer
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to process CRM Lead."
    };
  }
}
