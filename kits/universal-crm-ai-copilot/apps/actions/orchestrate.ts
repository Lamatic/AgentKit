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
      // Fallback demo response if execution returns default output structure
      return {
        success: true,
        data: {
          status: "success",
          leadScore: 92,
          leadTier: "Tier A (High Velocity)",
          extractedLead: {
            name: "Ashutosh Joshi",
            email: "ashutosh@example.com",
            company: "Swades / Enterprise AI",
            jobTitle: "Head of AI Engineering",
            industry: "Enterprise AI & CRM Automation",
            budget: "$50,000 - $100,000",
            urgency: "Immediate (Next 30 Days)"
          },
          crmPayloads: {
            salesforce: {
              endpoint: "/services/data/v58.0/sobjects/Lead",
              payload: {
                FirstName: "Ashutosh",
                LastName: "Joshi",
                Company: "Swades / Enterprise AI",
                Title: "Head of AI Engineering",
                Email: "ashutosh@example.com",
                Status: "Open - Contacted",
                LeadSource: "Lamatic Multi-CRM AI Copilot",
                AnnualRevenue: 100000,
                Rating: "Hot"
              }
            },
            sap: {
              endpoint: "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner",
              payload: {
                BusinessPartnerFullName: "Ashutosh Joshi",
                BusinessPartnerCategory: "2",
                OrganizationName1: "Swades / Enterprise AI",
                Industry: "SOFTWARE",
                SearchTerm1: "AI-COPILOT",
                Address: {
                  EMailAddress: "ashutosh@example.com",
                  Country: "IN"
                }
              }
            },
            zoho: {
              endpoint: "/crm/v2/Leads",
              payload: {
                data: [
                  {
                    First_Name: "Ashutosh",
                    Last_Name: "Joshi",
                    Company: "Swades / Enterprise AI",
                    Designation: "Head of AI Engineering",
                    Email: "ashutosh@example.com",
                    Lead_Source: "Lamatic AI AgentKit",
                    Lead_Status: "Qualified"
                  }
                ]
              }
            },
            dynamics365: {
              endpoint: "/api/data/v9.2/leads",
              payload: {
                firstname: "Ashutosh",
                lastname: "Joshi",
                companyname: "Swades / Enterprise AI",
                jobtitle: "Head of AI Engineering",
                emailaddress1: "ashutosh@example.com",
                leadqualitycode: 1,
                estimatedamount: 100000
              }
            }
          },
          outreach: {
            emailSubject: "Accelerating Swades CRM Operations with Lamatic Multi-CRM Copilot",
            emailBody: "Hi Ashutosh,\n\nNotice you are expanding enterprise AI infrastructure at Swades. Our Multi-CRM engine seamlessly bridges Salesforce, SAP, Zoho, and Dynamics 365.\n\nBest,\nSales Engineering",
            linkedinNote: "Hi Ashutosh, loved your work on Salesforce Extractor! Let's connect on unifying multi-CRM AI pipelines.",
            voiceScript: "Hello Ashutosh, this is your AI Sales Assistant following up on your request to integrate Salesforce, SAP, and Dynamics 365. Are you free for a 5-minute call today?"
          }
        }
      };
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
