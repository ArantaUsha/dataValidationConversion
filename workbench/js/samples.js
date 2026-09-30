// Fictional demo data only (mirrors /demo at the repository root). Nothing here comes from any client.

export const SAMPLE_HIERARCHIES_CSV = `Domain Code,Member Code,Structure,Date
FIN,X01,Corporate Lending,06/30/2024
FIN,X02,Retail Deposits,06/30/2024
FIN,X03,Commercial Banking,06/30/2024
RISK,B01,Credit Exposure,06/30/2024
RISK,B02,Market Exposure,06/30/2024
OPS,C01,Customer Operations,06/30/2024
OPS,C02,Payment Operations,06/30/2024
FIN,X01,Legacy Corporate Lending,03/31/2024
`;

export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rapportage registratienummer="DEMO-104" nihil="false" period="2024-06-30" FormulierID="DEMO_CB77" versie="1" frequentie="M">
    <post value="EBA_FIN_X01" cube="c01" rij="r_0010" kolom="c_0010" rijnr="1"/>
    <post value="1250000.50" cube="c01" rij="r_0020" kolom="c_0010" rijnr="1"/>
    <post value="FALSE" cube="c01" rij="r_0030" kolom="c_0010" rijnr="1"/>
    <post value="EBA_FIN_X02" cube="c01" rij="r_0040" kolom="c_0010" rijnr="1"/>
    <post value="EBA_FIN_X02" cube="c01" rij="r_0040" kolom="c_0010" rijnr="1"/>
    <post value="EBA_FIN_X99" cube="c01" rij="r_0050" kolom="c_0010" rijnr="1"/>
    <post value="750000000000000000" cube="c01" rij="r_0060" kolom="c_0010" rijnr="1"/>
    <!-- Same cell, different value: reported as a conflict -->
    <post value="7" cube="c01" rij="r_0080" kolom="c_0010" rijnr="2"/>
    <post value="8" cube="c01" rij="r_0080" kolom="c_0010" rijnr="2"/>
    <post value="00123" cube="c01" rij="r_0090" kolom="c_0010" rijnr="2"/>
    <post value="EBA_RISK_B01" cube="c01" rij="r_0070" kolom="c_0010" rijnr="2"/>
    <post value="0.875" cube="c01" rij="r_0070" kolom="c_0020" rijnr="2"/>
    <post value="TRUE" cube="c01" rij="r_0070" kolom="c_0030" rijnr="2"/>
    <post value="orphan" cube="c01" kolom="c_0040" rijnr="2"/>
</rapportage>
`;

/** Generates a large file to show the 60–70k post scale mentioned in the project notes. */
export function generateLargeXml(count = 65000) {
  const cols = ["0010", "0020", "0030", "0040", "0050", "0060", "0070"];
  const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>\n<rapportage registratienummer="DEMO-999" nihil="false" period="2024-12-31" FormulierID="DEMO_AC3402" versie="1" frequentie="Q">\n',
  ];
  for (let i = 0; i < count; i++) {
    const n = Math.floor(i / cols.length) + 1;
    const c = cols[i % cols.length];
    const value = c === "0010" ? "EBA_FIN_X01" : c === "0020" ? `Entity ${n}` : c === "0030" ? String(n * 137) : c === "0060" ? (n * 1.37).toFixed(2) : "EBA_RISK_B01";
    parts.push(`    <post value="${value}" cube="c01" rij="r_${String(n).padStart(4, "0")}" kolom="c_${c}" rijnr="${(n % 40) + 1}"/>\n`);
  }
  parts.push("</rapportage>\n");
  return parts.join("");
}
