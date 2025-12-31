interface MeterReading {
    End_Time_Stamp_UTC_ms: number;
    Start_Time_Stamp_UTC_ms: number;
    End_Date: string;
    Start_Date: string;
    Meter: number;
    Count: number;
    Protocol: string;
    Pulse_Cnt_1_First: number;
    Pulse_Cnt_1_Last: number;
    Pulse_Cnt_1_Diff: number;
    Pulse_Cnt_1_DeltaMax: number;
    Pulse_Cnt_2_First: number;
    Pulse_Cnt_2_Last: number;
    Pulse_Cnt_2_Diff: number;
    Pulse_Cnt_2_DeltaMax: number;
    Pulse_Cnt_3_First: number;
    Pulse_Cnt_3_Last: number;
    Pulse_Cnt_3_Diff: number;
    Pulse_Cnt_3_DeltaMax: number;
}

function formatToCustomString(date: Date): string {
    // 1. Parse the input string (MM/DD/YYYY) into a Date object
  
    // 2. Extract components
    const year = date.getFullYear();
    // Months are 0-indexed in JS/TS (January is 0), so add 1
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
  
    // 3. Concatenate into the final format
    return `${year}${month}${day}${hours}${minutes}`;
}

export async function getGasSubmeterUsage(dates: {start: string, end: string} | null): Promise<number> {
    if (dates == null) return 0;

    const accessKey = process.env.ENCOMPASS_IO_ACCESS_KEY;
    const deviceId = process.env.ENCOMPASS_IO_DEVICE_ID;
    const startDate = new Date(dates.start);
    const endDate = new Date(dates.end);

    // include up until the last day of the bill date
    endDate.setDate(endDate.getDate() + 1);
    const formattedStartDate = formatToCustomString(startDate);
    const formattedEndDate = formatToCustomString(endDate);
    try {
        const endpoint = `https://summary.ekmmetering.com/summary/api/v2/meter?key=${accessKey}&format=json&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3&timezone=America~Los_Angeles&devices=${deviceId}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&report=range&limit=1`;
        const response = await fetch(endpoint);
        const data: MeterReading[] = await response.json();
        let totalPulseCount = data[0].Pulse_Cnt_1_Diff;

        return totalPulseCount * 0.01;
    }
    catch (e) {
        console.error(e);
        return 0;
    }
}