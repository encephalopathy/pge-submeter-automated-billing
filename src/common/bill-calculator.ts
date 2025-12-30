import { extractGasTotalBill, extractThermsUsage, extractUsageDates, extractGasBillPage } from './pge-pdf-bill-extractor'
import { getGasSubmeterUsage } from './encompass-io-api-client';

export async function calculateGasBill(pdfPages: Array<string>) : Promise<any> {
    const gasBillPage = extractGasBillPage(pdfPages);

    if (gasBillPage == null) {
        throw new Error("Unable to find the gas usage page.");
    }

    const dates = extractUsageDates(gasBillPage);
    const thermsUsageTotal = extractThermsUsage(gasBillPage);
    const totalCost = extractGasTotalBill(gasBillPage);

    if (thermsUsageTotal == 0) {
        return { gasBillMain: 0, gasBillAdu: 0, dates: null }
    }

    const gasUsageADU = await getGasSubmeterUsage(dates);

    const amountUsedByMain = (thermsUsageTotal - gasUsageADU) / thermsUsageTotal;
    const mainHouseGasBill = amountUsedByMain * totalCost;
    const aduGasBill = totalCost - (amountUsedByMain * totalCost);

    return { gasBillMain: Number(mainHouseGasBill.toFixed(2)), gasBillAdu: Number(aduGasBill.toFixed(2)), dates: dates }
}

export function assemblePaymentRequestTargets(bill: { gasBillMain: number, gasBillAdu: number, dates: {start: string, end:string} }): any {
    const recipientAddressMain = process.env.ADDRESS_MAIN;
    const recipientAddressADU = process.env.ADDRESS_ADU;
    const recipientMain = process.env.ADDRESS_MAIN_RECIEPIENTS;
    const recipientADU = process.env.ADDRESS_ADU_RECIEPIENTS;

    return {
        main: {
            recipients: recipientMain,
            address: recipientAddressMain,
            amount: bill.gasBillMain,
            dates: bill.dates
        },
        adu: {
            recipients: recipientADU,
            address: recipientAddressADU,
            amount: bill.gasBillAdu,
            dates: bill.dates
        }
    }
}