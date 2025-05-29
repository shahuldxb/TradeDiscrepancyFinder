import { db } from "./db";
import { swiftMessageDependencies, swiftMessageFlowPatterns } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Seeds SWIFT MT7xx message dependencies based on official SWIFT documentation
 * Source: SWIFT MT7xx Message Dependencies PDF - Category 7 Documentary Credits and Guarantees Standards MT November 2019
 */

export async function seedSwiftMessageDependencies() {
  try {
    console.log("Seeding SWIFT message dependencies from official documentation...");

    // Clear existing data
    await db.delete(swiftMessageDependencies);
    await db.delete(swiftMessageFlowPatterns);

    // Direct Continuations - Based on official documentation Table 2.1
    const directContinuations = [
      {
        id: "dep_mt700_mt701",
        messageTypeCode: "MT700",
        directContinuation: "MT701",
        dependencyType: "direct_continuation",
        businessFlow: "documentary_credit",
        description: "Continuation of MT700 (Issue of a Documentary Credit)",
        reference: "MT701 Scope, p.32"
      },
      {
        id: "dep_mt707_mt708",
        messageTypeCode: "MT707",
        directContinuation: "MT708",
        dependencyType: "direct_continuation",
        businessFlow: "amendment",
        description: "Continuation of MT707 (Amendment to a Documentary Credit)",
        reference: "MT708 Scope, p.71"
      },
      {
        id: "dep_mt710_mt711",
        messageTypeCode: "MT710",
        directContinuation: "MT711",
        dependencyType: "direct_continuation",
        businessFlow: "documentary_credit",
        description: "Continuation of MT710 (Advice of a Third Bank's Documentary Credit)",
        reference: "MT711 Scope, p.100"
      },
      {
        id: "dep_mt720_mt721",
        messageTypeCode: "MT720",
        directContinuation: "MT721",
        dependencyType: "direct_continuation",
        businessFlow: "documentary_credit",
        description: "Continuation of MT720 (Transfer of a Documentary Credit)",
        reference: "MT721 Scope, p.126"
      }
    ];

    // Documentary Credit Flow - Based on official documentation Table 3.1
    const documentaryCreditFlow = [
      {
        id: "dep_mt700_flows",
        messageTypeCode: "MT700",
        canBeFollowedBy: ["MT707", "MT710", "MT720", "MT730", "MT740", "MT750", "MT752", "MT754", "MT756"],
        dependencyType: "business_flow",
        businessFlow: "documentary_credit",
        description: "MT700 can be followed by various documentary credit related messages",
        reference: "Documentary Credit Flow, Section 3"
      },
      {
        id: "dep_mt705_mt700",
        messageTypeCode: "MT705",
        canBeFollowedBy: ["MT700"],
        dependencyType: "business_flow",
        businessFlow: "documentary_credit",
        description: "Full Documentary Credit after Pre-Advice",
        reference: "MT705 Scope, p.37"
      },
      {
        id: "dep_mt707_follow",
        messageTypeCode: "MT707",
        canFollowAfter: ["MT700"],
        canBeFollowedBy: ["MT730"],
        dependencyType: "business_flow",
        businessFlow: "amendment",
        description: "Amendment to the Documentary Credit",
        reference: "MT707 Scope, p.46"
      },
      {
        id: "dep_mt710_follow",
        messageTypeCode: "MT710",
        canFollowAfter: ["MT700"],
        canBeFollowedBy: ["MT730"],
        dependencyType: "business_flow",
        businessFlow: "documentary_credit",
        description: "Advice of the Documentary Credit to another bank",
        reference: "MT710 Scope, p.78"
      }
    ];

    // Reimbursement Flow - Based on official documentation Table 4.1
    const reimbursementFlow = [
      {
        id: "dep_mt740_flow",
        messageTypeCode: "MT740",
        canFollowAfter: ["MT700"],
        canBeFollowedBy: ["MT742", "MT747"],
        dependencyType: "business_flow",
        businessFlow: "reimbursement",
        description: "Authorization to Reimburse",
        reference: "MT740 Scope, p.146"
      },
      {
        id: "dep_mt742_flow",
        messageTypeCode: "MT742",
        canFollowAfter: ["MT740"],
        canBeFollowedBy: ["MT744", "MT756"],
        dependencyType: "business_flow",
        businessFlow: "reimbursement",
        description: "Reimbursement Claim",
        reference: "MT742 Scope, p.156"
      },
      {
        id: "dep_mt744_flow",
        messageTypeCode: "MT744",
        canFollowAfter: ["MT742"],
        dependencyType: "business_flow",
        businessFlow: "reimbursement",
        description: "Notice of Non-Conforming Reimbursement Claim",
        reference: "MT744 Scope, p.164"
      },
      {
        id: "dep_mt747_flow",
        messageTypeCode: "MT747",
        canFollowAfter: ["MT740"],
        dependencyType: "business_flow",
        businessFlow: "reimbursement",
        description: "Amendment to an Authorization to Reimburse",
        reference: "MT747 Scope, p.171"
      },
      {
        id: "dep_mt756_flow",
        messageTypeCode: "MT756",
        canFollowAfter: ["MT700", "MT742"],
        dependencyType: "business_flow",
        businessFlow: "reimbursement",
        description: "Advice of Reimbursement or Payment",
        reference: "MT756 Scope, p.203"
      }
    ];

    // Discrepancy and Payment Flow - Based on official documentation Table 5.1
    const discrepancyFlow = [
      {
        id: "dep_mt750_flow",
        messageTypeCode: "MT750",
        canFollowAfter: ["MT700"],
        canBeFollowedBy: ["MT734", "MT752"],
        dependencyType: "business_flow",
        businessFlow: "discrepancy",
        description: "Advice of Discrepancy",
        reference: "MT750 Scope, p.178"
      },
      {
        id: "dep_mt752_flow",
        messageTypeCode: "MT752",
        canFollowAfter: ["MT700", "MT750"],
        canBeFollowedBy: ["MT754"],
        dependencyType: "business_flow",
        businessFlow: "discrepancy",
        description: "Authorization to Pay, Accept or Negotiate",
        reference: "MT752 Scope, p.185"
      },
      {
        id: "dep_mt734_flow",
        messageTypeCode: "MT734",
        canFollowAfter: ["MT750"],
        canBeFollowedBy: ["MT732"],
        dependencyType: "business_flow",
        businessFlow: "discrepancy",
        description: "Advice of Refusal",
        reference: "MT734 Scope, p.140"
      },
      {
        id: "dep_mt732_flow",
        messageTypeCode: "MT732",
        canFollowAfter: ["MT734"],
        dependencyType: "business_flow",
        businessFlow: "discrepancy",
        description: "Advice of Discharge (after refusal)",
        reference: "MT732 Scope, p.137"
      },
      {
        id: "dep_mt754_flow",
        messageTypeCode: "MT754",
        canFollowAfter: ["MT700", "MT752"],
        dependencyType: "business_flow",
        businessFlow: "payment",
        description: "Advice of Payment/Acceptance/Negotiation",
        reference: "MT754 Scope, p.193"
      }
    ];

    // Acknowledgement Flow
    const acknowledgementFlow = [
      {
        id: "dep_mt730_flow",
        messageTypeCode: "MT730",
        canFollowAfter: ["MT700", "MT707", "MT710", "MT720"],
        dependencyType: "business_flow",
        businessFlow: "acknowledgement",
        description: "Acknowledgement of various message types",
        reference: "MT730 Scope, p.131"
      }
    ];

    // Continuation message dependencies
    const continuationDependencies = [
      {
        id: "dep_mt701_continuation",
        messageTypeCode: "MT701",
        isContinuationOf: "MT700",
        canFollowAfter: ["MT700"],
        dependencyType: "direct_continuation",
        businessFlow: "documentary_credit",
        description: "Direct continuation of MT700",
        reference: "MT701 Scope, p.32"
      },
      {
        id: "dep_mt708_continuation",
        messageTypeCode: "MT708",
        isContinuationOf: "MT707",
        canFollowAfter: ["MT707"],
        dependencyType: "direct_continuation",
        businessFlow: "amendment",
        description: "Direct continuation of MT707",
        reference: "MT708 Scope, p.71"
      },
      {
        id: "dep_mt711_continuation",
        messageTypeCode: "MT711",
        isContinuationOf: "MT710",
        canFollowAfter: ["MT710"],
        dependencyType: "direct_continuation",
        businessFlow: "documentary_credit",
        description: "Direct continuation of MT710",
        reference: "MT711 Scope, p.100"
      },
      {
        id: "dep_mt721_continuation",
        messageTypeCode: "MT721",
        isContinuationOf: "MT720",
        canFollowAfter: ["MT720"],
        dependencyType: "direct_continuation",
        businessFlow: "documentary_credit",
        description: "Direct continuation of MT720",
        reference: "MT721 Scope, p.126"
      }
    ];

    // Combine all dependencies
    const allDependencies = [
      ...directContinuations,
      ...documentaryCreditFlow,
      ...reimbursementFlow,
      ...discrepancyFlow,
      ...acknowledgementFlow,
      ...continuationDependencies
    ];

    // Insert dependencies
    await db.insert(swiftMessageDependencies).values(allDependencies);

    // Message Flow Patterns - Common business processes
    const flowPatterns = [
      {
        id: "pattern_complete_dc_issuance",
        patternName: "Complete Documentary Credit Issuance",
        description: "Full process from pre-advice to final credit issuance",
        messageSequence: ["MT705", "MT700", "MT701"],
        flowType: "linear",
        businessProcess: "full_documentary_credit"
      },
      {
        id: "pattern_dc_amendment",
        patternName: "Documentary Credit Amendment Process",
        description: "Amendment to an existing documentary credit",
        messageSequence: ["MT700", "MT707", "MT708", "MT730"],
        flowType: "linear",
        businessProcess: "amendment_process"
      },
      {
        id: "pattern_discrepancy_resolution",
        patternName: "Discrepancy Resolution Flow",
        description: "Process for handling discrepancies in documents",
        messageSequence: ["MT700", "MT750", "MT752", "MT754"],
        flowType: "branching",
        businessProcess: "discrepancy_resolution"
      },
      {
        id: "pattern_reimbursement_auth",
        patternName: "Reimbursement Authorization Flow",
        description: "Complete reimbursement process",
        messageSequence: ["MT700", "MT740", "MT742", "MT756"],
        flowType: "linear",
        businessProcess: "reimbursement_authorization"
      },
      {
        id: "pattern_third_bank_advisory",
        patternName: "Third Bank Advisory Flow",
        description: "Advisory process involving third bank",
        messageSequence: ["MT700", "MT710", "MT711", "MT730"],
        flowType: "linear",
        businessProcess: "third_bank_advisory"
      },
      {
        id: "pattern_credit_transfer",
        patternName: "Transfer of Credit Flow",
        description: "Transfer of documentary credit to another beneficiary",
        messageSequence: ["MT700", "MT720", "MT721", "MT730"],
        flowType: "linear",
        businessProcess: "credit_transfer"
      },
      {
        id: "pattern_refusal_discharge",
        patternName: "Refusal and Discharge Flow",
        description: "Process for document refusal and subsequent discharge",
        messageSequence: ["MT700", "MT750", "MT734", "MT732"],
        flowType: "conditional",
        businessProcess: "refusal_discharge"
      }
    ];

    await db.insert(swiftMessageFlowPatterns).values(flowPatterns);

    console.log(`Successfully seeded ${allDependencies.length} message dependencies and ${flowPatterns.length} flow patterns`);
    
    return {
      dependencies: allDependencies.length,
      flowPatterns: flowPatterns.length
    };

  } catch (error) {
    console.error("Error seeding SWIFT message dependencies:", error);
    throw error;
  }
}

export async function getMessageDependencies(messageTypeCode: string) {
  try {
    const dependencies = await db
      .select()
      .from(swiftMessageDependencies)
      .where(eq(swiftMessageDependencies.messageTypeCode, messageTypeCode));
    
    return dependencies;
  } catch (error) {
    console.error("Error fetching message dependencies:", error);
    return [];
  }
}

export async function getMessageFlowPatterns() {
  try {
    const patterns = await db
      .select()
      .from(swiftMessageFlowPatterns)
      .where(eq(swiftMessageFlowPatterns.isActive, true));
    
    return patterns;
  } catch (error) {
    console.error("Error fetching message flow patterns:", error);
    return [];
  }
}

export async function validateMessageSequence(messageSequence: string[]): Promise<{
  isValid: boolean;
  violations: string[];
  recommendations: string[];
}> {
  try {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check each message in sequence against dependencies
    for (let i = 0; i < messageSequence.length - 1; i++) {
      const currentMessage = messageSequence[i];
      const nextMessage = messageSequence[i + 1];

      const dependencies = await getMessageDependencies(currentMessage);
      const canBeFollowedBy = dependencies.find(d => d.canBeFollowedBy)?.canBeFollowedBy as string[] || [];

      if (canBeFollowedBy.length > 0 && !canBeFollowedBy.includes(nextMessage)) {
        violations.push(`${currentMessage} cannot be followed by ${nextMessage} according to SWIFT standards`);
        recommendations.push(`${currentMessage} can be followed by: ${canBeFollowedBy.join(", ")}`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      recommendations
    };

  } catch (error) {
    console.error("Error validating message sequence:", error);
    return {
      isValid: false,
      violations: ["Error validating sequence"],
      recommendations: []
    };
  }
}