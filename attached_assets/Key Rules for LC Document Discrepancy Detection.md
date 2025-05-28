# Key Rules for LC Document Discrepancy Detection

## UCP 600 Key Rules

### Article 2 - Definitions
- **Complying presentation**: A presentation that is in accordance with the terms and conditions of the credit, the applicable provisions of UCP 600, and international standard banking practice.
- **Credit**: Any arrangement that is irrevocable and constitutes a definite undertaking of the issuing bank to honor a complying presentation.
- **Presentation**: The delivery of documents under a credit to the issuing bank or nominated bank or the documents so delivered.

### Article 14 - Standard for Examination of Documents
- Banks must examine documents on the basis of documents alone to determine if they appear on their face to constitute a complying presentation.
- Banks have a maximum of 5 banking days following presentation to determine compliance.
- Data in documents need not be identical but must not conflict with data in other documents or the credit.
- Document descriptions of goods/services may be in general terms in documents other than commercial invoices.
- Documents not required by the credit will be disregarded.
- Conditions without stipulated documents to indicate compliance will be disregarded.
- Documents must not be dated later than their date of presentation.
- Addresses of beneficiary and applicant need not be the same as in the credit but must be within the same country.

### Article 16 - Discrepant Documents, Waiver and Notice
- Banks may refuse to honor or negotiate when presentation does not comply.
- When refusing, banks must give a single notice stating:
  - That the bank is refusing to honor or negotiate
  - Each discrepancy for which the bank refuses
  - Whether the bank is holding documents pending further instructions, awaiting waiver, returning documents, or acting on previous instructions
- Notice must be given by telecommunication or expeditious means no later than close of 5th banking day following presentation.

### Article 17 - Original Documents and Copies
- At least one original of each stipulated document must be presented.
- Documents with original signatures, marks, stamps, or labels of the issuer are treated as originals.
- Documents are also accepted as original if they appear to be written/typed/perforated by the issuer's hand, on original stationery, or state they are original.

### Article 18 - Commercial Invoice
- Must appear issued by the beneficiary
- Must be made out in the name of the applicant
- Must be in the same currency as the credit
- Need not be signed
- Description of goods/services must correspond with that in the credit

### Article 20 - Bill of Lading
- Must indicate the carrier's name and be signed by carrier/master or their agent
- Must indicate goods shipped on board a named vessel at the port of loading
- Must indicate shipment from port of loading to port of discharge as stated in credit
- Must be the sole original or full set as indicated
- Must contain terms and conditions of carriage
- Must not indicate it is subject to a charter party

## SWIFT MT Message Types Relevant for LC Discrepancy Detection

### MT 700 - Issue of a Documentary Credit
- Contains the complete terms and conditions of a documentary credit

### MT 707 - Amendment to a Documentary Credit
- Contains amendments to a documentary credit

### MT 710 - Advice of a Third Bank's or a Non-Bank's Documentary Credit
- Used to advise a documentary credit to the beneficiary through an advising bank

### MT 734 - Advice of Refusal
- Used to advise the refusal of documents under a documentary credit

### MT 750 - Advice of Discrepancy
- Used to advise discrepancies in documents presented under a documentary credit

### MT 752 - Authorization to Pay, Accept or Negotiate
- Used to authorize payment, acceptance, or negotiation under a documentary credit

## Common Discrepancy Types Based on UCP 600 and SWIFT MT

1. **Document Consistency Issues**:
   - Data conflicts between documents
   - Description of goods differs between invoice and credit
   - Currency discrepancies

2. **Presentation Timing Issues**:
   - Late presentation (after expiry date)
   - Documents dated after presentation date
   - Shipment date outside allowed period

3. **Document Format Issues**:
   - Missing original documents
   - Unsigned documents where signature is required
   - Incorrect number of document copies

4. **Content Discrepancies**:
   - Incorrect beneficiary or applicant details
   - Incorrect ports of loading/discharge
   - Incorrect vessel name or shipping details
   - Incorrect or missing reference numbers

5. **Commercial Invoice Issues**:
   - Invoice amount exceeds credit amount
   - Invoice in wrong currency
   - Invoice not issued by beneficiary
   - Invoice description doesn't match credit

6. **Transport Document Issues**:
   - Bill of lading not showing "on board" notation
   - Missing carrier signature
   - Indication of charter party when prohibited
   - Transhipment indicated when prohibited

7. **Insurance Document Issues**:
   - Coverage less than required amount
   - Wrong risks covered
   - Late effective date

8. **Certificate Issues**:
   - Missing required certificates
   - Certificates not issued by required parties
   - Certificates with incorrect content or format
