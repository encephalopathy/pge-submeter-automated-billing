import { calculateGasBill } from '../src/common/bill-calculator';
import * as encompassApiClient from '../src/common/encompass-io-api-client';
import * as pgeBillParser from '../src/common/pge-pdf-bill-extractor';


describe('PG&E Billing', () => {
    test('given no gas bill page found - no pg&e data is extracted', async () => {
        // setup
        const pages = [
            "ENERGY STATEMENT  www.pge.com/MyEnergy  Account No: 1111111111-4  Statement Date:   11/25/2025  Due Date:   12/16/2025  Visit   www.pge.com/MyEnergy   for a detailed bill comparison.   link  Gas Usage This Period:22.0 Therms 32 billing days Average Daily Usage 0.6875 Therms For 10/17 2025 Therms used 1.059974 For 10/19 2025 Therms used 1.059974 For 10/20 2025 Therms used 1.059974 For 10/22 2025 Therms used 1.059974 For 10/24 2025 Therms used 1.059974 For 10/26 2025 Therms used 1.059974 For 10/27 2025 Therms used 1.059974 For 10/29 2025 Therms used 1.059974 For 10/31 2025 Therms used 1.059974 For 11/02 2025 Therms used 1.059974 For 11/03 2025 Therms used 1.059974 For 11/05 2025 Therms used 1.059974 For 11/06 2025 Therms used 1.059974 For 11/07 2025 Therms used 1.059974 For 11/08 2025 Therms used 1.059974 For 11/09 2025 Therms used 1.059974 For 11/11 2025 Therms used 1.059974 For 11/12 2025 Therms used 1.059974 For 11/14 2025 Therms used 1.059974 For 11/15 2025 Therms used 1.059974 For 11/16 2025 Therms used 1.059974  Page 8 of 9  Electric Charges  10/17/2025 - 11/17/2025 (32 billing days)  Service For:   xxxxx POOP WAY  Service Agreement ID:   1111111111  Rate Schedule:   G1 X Residential Service  10/17/2025 – 10/31/2025   Your Tier Usage   1   2  .  Tier 1 Allowance   7.35   Therms   (15 days   x   0.49 Therms/day)  Tier 1 Usage   7.350000 Therms   @   $2.52299   $18.54  Tier 2 Usage   2.962500 Therms   @   $3.03685   9.00  Gas PPP Surcharge ($0.14324 /Therm)   1.48  Poop Utility Users' Tax (5.500%)   1.51  11/01/2025 – 11/17/2025   Your Tier Usage   1   2  .  Tier 1 Allowance   25.16   Therms   (17 days   x   1.48 Therms/day)  Tier 1 Usage   11.687500 Therms   @   $2.63904   $30.84  Gas PPP Surcharge ($0.14324 /Therm)   1.67  Poop Utility Users' Tax (5.500%)   1.70  Total Gas Charges   $64.74  Average Daily Usage (Therms / day)  Last Year   Last Period   Current Period N/A   0.60   0.69  Service Information  Meter #   11111111  Current Meter Reading   6,990  Prior Meter Reading   6,969  Difference   21  Multiplier   1.059974  Total Usage   22.000000 Therms  Baseline Territory   X  Serial   W  Gas Procurement Costs ($/Therm)  10/17/2025 - 10/31/2025   $0.41601  11/01/2025 - 11/17/2025   $0.53206  Gas Usage This Period: 22.000000 Therms, 32 billing days  Therms   =   Average Daily Usage 0.69  10/17   10/20   10/23   10/26   10/29   11/01   11/04   11/07   11/10   11/13   11/16  0  1  2  3  4 5"
        ];
        
        // verify
        expect(calculateGasBill(pages)).rejects.toThrow("Unable to find the gas usage page.");
    });
    test('given pg&e gas page, when therms not detected - returns empty bill', async () => {
        // setup
        const pages = [
            "ENERGY STATEMENT  www.pge.com/MyEnergy  Account No: 1111111111-4  Statement Date:   11/25/2025  Due Date:   12/16/2025  Visit   www.pge.com/MyEnergy   for a detailed bill comparison.   link  Gas Usage This Period:22.0 Therms 32 billing days Average Daily Usage 0.6875 Therms For 10/17 2025 Therms used 1.059974 For 10/19 2025 Therms used 1.059974 For 10/20 2025 Therms used 1.059974 For 10/22 2025 Therms used 1.059974 For 10/24 2025 Therms used 1.059974 For 10/26 2025 Therms used 1.059974 For 10/27 2025 Therms used 1.059974 For 10/29 2025 Therms used 1.059974 For 10/31 2025 Therms used 1.059974 For 11/02 2025 Therms used 1.059974 For 11/03 2025 Therms used 1.059974 For 11/05 2025 Therms used 1.059974 For 11/06 2025 Therms used 1.059974 For 11/07 2025 Therms used 1.059974 For 11/08 2025 Therms used 1.059974 For 11/09 2025 Therms used 1.059974 For 11/11 2025 Therms used 1.059974 For 11/12 2025 Therms used 1.059974 For 11/14 2025 Therms used 1.059974 For 11/15 2025 Therms used 1.059974 For 11/16 2025 Therms used 1.059974  Page 8 of 9  Details of Gas Charges  10/17/2025 - 11/17/2025 (32 billing days)  Service For:   xxxxx POOP WAY  Service Agreement ID:   1111111111  Rate Schedule:   G1 X Residential Service  10/17/2025 – 10/31/2025   Your Tier Usage   1   2  .  Tier 1 Allowance   7.35   Therms   (15 days   x   0.49 Therms/day)  Tier 1 Usage   7.350000 Therms   @   $2.52299   $18.54  Tier 2 Usage   2.962500 Therms   @   $3.03685   9.00  Gas PPP Surcharge ($0.14324 /Therm)   1.48  Poop Utility Users' Tax (5.500%)   1.51  11/01/2025 – 11/17/2025   Your Tier Usage   1   2  .  Tier 1 Allowance   25.16   Therms   (17 days   x   1.48 Therms/day)  Tier 1 Usage   11.687500 Therms   @   $2.63904   $30.84  Gas PPP Surcharge ($0.14324 /Therm)   1.67  Poop Utility Users' Tax (5.500%)   1.70  Total Gas Charges   $64.74  Average Daily Usage (Therms / day)  Last Year   Last Period   Current Period N/A   0.60   0.69  Service Information  Meter #   11111111  Current Meter Reading   6,990  Prior Meter Reading   6,969  Difference   21  Multiplier   1.059974  Total Usage   22.000000 Therms  Baseline Territory   X  Serial   W  Gas Procurement Costs ($/Therm)  10/17/2025 - 10/31/2025   $0.41601  11/01/2025 - 11/17/2025   $0.53206  Gas Usage This Period: 22.000000 Therms, 32 billing days  Therms   =   Average Daily Usage 0.69  10/17   10/20   10/23   10/26   10/29   11/01   11/04   11/07   11/10   11/13   11/16  0  1  2  3  4 5"
        ];
        const encompassIOSpy = jest.spyOn(encompassApiClient, 'getGasSubmeterUsage').mockResolvedValue(5.0);
        const pgeParserSpy = jest.spyOn(pgeBillParser, 'extractThermsUsage').mockReturnValue(0);

        // act
        const bill = await calculateGasBill(pages);
        encompassIOSpy.mockRestore();
        pgeParserSpy.mockRestore();

        // verify
        expect(bill.gasBillAdu).toBe(0);
        expect(bill.gasBillMain).toBe(0);
        expect(bill.dates).toBeNull();
    });
    test('given pg&e gas page given - gas bill and dates extracted', async () => {
        // setup
        const pages = [
            "ENERGY STATEMENT  www.pge.com/MyEnergy  Account No: 1111111111-4  Statement Date:   11/25/2025  Due Date:   12/16/2025  Visit   www.pge.com/MyEnergy   for a detailed bill comparison.   link  Gas Usage This Period:22.0 Therms 32 billing days Average Daily Usage 0.6875 Therms For 10/17 2025 Therms used 1.059974 For 10/19 2025 Therms used 1.059974 For 10/20 2025 Therms used 1.059974 For 10/22 2025 Therms used 1.059974 For 10/24 2025 Therms used 1.059974 For 10/26 2025 Therms used 1.059974 For 10/27 2025 Therms used 1.059974 For 10/29 2025 Therms used 1.059974 For 10/31 2025 Therms used 1.059974 For 11/02 2025 Therms used 1.059974 For 11/03 2025 Therms used 1.059974 For 11/05 2025 Therms used 1.059974 For 11/06 2025 Therms used 1.059974 For 11/07 2025 Therms used 1.059974 For 11/08 2025 Therms used 1.059974 For 11/09 2025 Therms used 1.059974 For 11/11 2025 Therms used 1.059974 For 11/12 2025 Therms used 1.059974 For 11/14 2025 Therms used 1.059974 For 11/15 2025 Therms used 1.059974 For 11/16 2025 Therms used 1.059974  Page 8 of 9  Details of Gas Charges  10/17/2025 - 11/17/2025 (32 billing days)  Service For:   xxxxx POOP WAY  Service Agreement ID:   1111111111  Rate Schedule:   G1 X Residential Service  10/17/2025 – 10/31/2025   Your Tier Usage   1   2  .  Tier 1 Allowance   7.35   Therms   (15 days   x   0.49 Therms/day)  Tier 1 Usage   7.350000 Therms   @   $2.52299   $18.54  Tier 2 Usage   2.962500 Therms   @   $3.03685   9.00  Gas PPP Surcharge ($0.14324 /Therm)   1.48  Poop Utility Users' Tax (5.500%)   1.51  11/01/2025 – 11/17/2025   Your Tier Usage   1   2  .  Tier 1 Allowance   25.16   Therms   (17 days   x   1.48 Therms/day)  Tier 1 Usage   11.687500 Therms   @   $2.63904   $30.84  Gas PPP Surcharge ($0.14324 /Therm)   1.67  Poop Utility Users' Tax (5.500%)   1.70  Total Gas Charges   $64.74  Average Daily Usage (Therms / day)  Last Year   Last Period   Current Period N/A   0.60   0.69  Service Information  Meter #   11111111  Current Meter Reading   6,990  Prior Meter Reading   6,969  Difference   21  Multiplier   1.059974  Total Usage   22.000000 Therms  Baseline Territory   X  Serial   W  Gas Procurement Costs ($/Therm)  10/17/2025 - 10/31/2025   $0.41601  11/01/2025 - 11/17/2025   $0.53206  Gas Usage This Period: 22.000000 Therms, 32 billing days  Therms   =   Average Daily Usage 0.69  10/17   10/20   10/23   10/26   10/29   11/01   11/04   11/07   11/10   11/13   11/16  0  1  2  3  4 5"
        ];
        const spy = jest.spyOn(encompassApiClient, 'getGasSubmeterUsage').mockResolvedValue(5.0);
        
        // act
        const bill = await calculateGasBill(pages);
        spy.mockRestore();
        
        // verify
        expect(bill.gasBillAdu).toBe(15.41);
        expect(bill.gasBillMain).toBe(49.33);
        expect(bill.dates).toBeDefined();
        expect(bill.dates.start).toBe('10/17/2025');
        expect(bill.dates.end).toBe('11/17/2025');
    });
});