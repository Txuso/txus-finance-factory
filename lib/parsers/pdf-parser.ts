import PDFParser from "pdf2json";
import { Categoria, CATEGORIAS } from '@/lib/types/transaction';

export interface ParsedTransaction {
    fecha: Date;
    descripcion: string;
    monto: number;
    categoria: Categoria;
    tipo: 'Gasto variable' | 'Gasto fijo' | 'Ingreso';
}

function guessCategory(description: string): Categoria {
    const desc = description.toUpperCase();

    // Trabajo / Ingresos
    if (desc.includes('NOMINA')) return 'Trabajo';

    // Inversiones
    if (desc.includes('INDEXA') || desc.includes('REVOLUT')) return 'Inversión';

    // Supermercado
    if (desc.includes('MERCADONA') || desc.includes('COALIMENT') || desc.includes('MARKET') ||
        desc.includes('EROSKI') || desc.includes('LIDL') || desc.includes('SUPERMERCADO')) return 'Supermercado';

    // Transporte
    if (desc.includes('REPSOL') || desc.includes('CEPSA') || desc.includes('GASOLINERA') ||
        desc.includes('BP') || desc.includes('EMPALME')) return 'Transporte';

    // Vivienda (Gastos fijos/Hogar)
    if (desc.includes('CUOTA PTMO') || desc.includes('GASTOS PISO GERB') || desc.includes('COMUNITAT JOSU MENSUAL')) return 'Vivienda';

    // Videojuegos
    if (desc.includes('NINTENDO') || desc.includes('XTRALIFE')) return 'Videojuegos';

    // Ocio
    if (desc.includes('AMZN') || desc.includes('AMAZON') || desc.includes('WALLAPOP')) return 'Ocio';

    // Suscripciones
    if (desc.includes('NETFLIX') || desc.includes('SPOTIFY') || desc.includes('HBO') || desc.includes('PRIME')) return 'Suscripciones';

    // Comunicaciones
    if (desc.includes('VODAFONE') || desc.includes('MOVISTAR') || desc.includes('O2') || desc.includes('DIGI')) return 'Comunicaciones';

    // Otros
    if (desc.includes('FARMACIA')) return 'Salud';
    if (desc.includes('TRANSF. MANGOPAY') || desc.includes('APLAZAME')) return 'Otros';
    if (desc.includes('INGRESO') || desc.includes('TRANSFERENCIA A FAVOR')) return 'Otros';

    return 'Otros';
}

function guessType(description: string, amount: number): 'Gasto variable' | 'Gasto fijo' | 'Ingreso' {
    const desc = description.toUpperCase();

    if (amount > 0) return 'Ingreso';

    // Ingresos específicos por nombre (aunque el monto debería ser > 0, por si acaso)
    if (desc.includes('NOMINA') || desc.includes('TRANSF. MANGOPAY')) return 'Ingreso';

    // Gastos fijos
    if (
        desc.includes('CUOTA PTMO') ||
        desc.includes('GASTOS PISO GERB') ||
        desc.includes('APLAZAME') ||
        desc.includes('COMUNITAT JOSU MENSUAL')
    ) {
        return 'Gasto fijo';
    }

    return 'Gasto variable';
}

export async function parseBankStatement(buffer: Buffer): Promise<ParsedTransaction[]> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1 as any); // 1 = Raw Text enabled

        pdfParser.on("pdfParser_dataError", (errData: any) => {
            console.error("PDF2JSON Error:", errData.parserError);
            reject(new Error("Failed to parse PDF"));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            try {
                const rawText = pdfParser.getRawTextContent();
                const lines = rawText.split(/\r\n|\n/).filter((line: string) => line.trim().length > 0);
                const transactions: ParsedTransaction[] = [];

                // Regex for date: DD/MM/YYYY or DD-MM-YYYY
                const dateRegex = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/;

                // Regex for amount (Global match)
                // Capture optional negative sign (hyphen, dashes, unicode minus), optional space, then digits/dots, then comma, then 2 decimals.
                const amountRegex = /([-\u2212\u2013\u2014]?\s*[\d\.]+,\d{2})/g;

                for (const line of lines) {
                    const cleanLine = decodeURIComponent(line);

                    const dateMatch = cleanLine.match(dateRegex);
                    // Get ALL numbers in the line
                    const amountMatches = [...cleanLine.matchAll(amountRegex)];

                    if (dateMatch && amountMatches.length > 0) {
                        const [_, day, month, year] = dateMatch;
                        // Timezone fix: Set to 12:00 PM
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);

                        // LOGIC: Take the FIRST match always. 
                        // The Bank Statement format is usually: Date - Description - Amount - Balance
                        // So the first number is the Amount.
                        const targetMatch = amountMatches[1];

                        // Normalize Amount String
                        let amountStr = targetMatch[1]
                            .replace(/\s/g, '') // Remove ANY internal spaces
                            .replace(/[\u2212\u2013\u2014]/g, '-') // Normalize dashes to hyphen
                            .replace(/\./g, '') // Remove thousands separator
                            .replace(',', '.'); // Decimal comma to dot

                        const amount = parseFloat(amountStr);
                        console.log(amountStr, amount);

                        // Cleanup Description
                        // Remove regex matches from the original line to leave just the description
                        let description = cleanLine.replace(dateMatch[0], '');

                        // Remove ALL found amounts (Amount + Balance) so they don't leak into description
                        for (const match of amountMatches) {
                            description = description.replace(match[0], '');
                        }

                        // Final cleanup
                        description = description.trim();
                        // Remove potential garbage at start (like stray dashes)
                        description = description.replace(/^[-\u2212\u2013\u2014\s]+/, '');
                        description = description.replace(/[€$]/g, '');
                        description = description.trim();

                        if (description.length > 2) {
                            transactions.push({
                                fecha: date,
                                descripcion: description,
                                monto: amount,
                                categoria: guessCategory(description),
                                tipo: guessType(description, amount)
                            });
                        }
                    }
                }

                resolve(transactions);

            } catch (err) {
                console.error("Parsing logic error:", err);
                reject(err);
            }
        });

        pdfParser.parseBuffer(buffer);
    });
}
