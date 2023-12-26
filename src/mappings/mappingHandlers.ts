import { SubstrateEvent } from "@subql/types";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { Crowdloan } from "../types";
import { Balance } from "@polkadot/types/interfaces";

const parallelAccount = "13wNbioJt44NKrcQ5ZUrshJqP7TKzQbzZt5nhkeL4joa3PAX";

export async function handleEvent(event: SubstrateEvent): Promise<void> {
  logger.info(`${event}`);

  let evt = JSON.parse(JSON.stringify(event));
  const blockNumber = event.block.block.header.number.toNumber();
  //   Create the record by constructing id from blockNumber + eventIndex
  const record = new Crowdloan(
    `${blockNumber.toString()}-${event.idx.toString()}`
  );

  const {
    event: {
      data: [from, to, value],
    },
  } = evt;

  // 如果收款地址是parallel地址
  if (to.toString().toUpperCase() == parallelAccount.toUpperCase()) {
    const amount = (value as Balance).toString();

    // 把account转换成ss58为6的地址
    const publicKey = decodeAddress(from.toString());
    const convertedAccount = encodeAddress(publicKey, 6);

    const timestamp = Math.floor(event.block.timestamp.getTime() / 1000);

    // 只记录2021年1月23日到2022年3月10日的数据
    if (
      timestamp >= 1640217600 &&
      timestamp <= 1646956800 &&
      blockNumber <= 9360368
    ) {
      logger.info(
        `blockNumber: ${blockNumber}, timestamp: ${timestamp}, account: ${convertedAccount}, amount: ${amount}`
      );
      record.event = "Transfer";
      record.account = convertedAccount;
      record.paraid = "Parallel";
      record.amount = amount;
      record.blockHeight = blockNumber;
      record.timestamp = Math.floor(event.block.timestamp.getTime() / 1000);

      await record.save();
    }
  }
}
