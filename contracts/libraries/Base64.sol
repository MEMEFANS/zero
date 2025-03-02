// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Base64 {
    string internal constant _TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        // 计算编码后的长度
        uint256 len = 4 * ((data.length + 2) / 3);

        // 创建结果字符串
        string memory result = new string(len);
        assembly {
            let tablePtr := add(_TABLE, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, mload(data)) {
                i := add(i, 3)
            } {
                let input := 0
                if lt(i, mload(data)) {
                    input := mload(add(add(data, 32), i))
                }

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            // 补充末尾的 =
            switch mod(mload(data), 3)
            case 1 { mstore8(sub(resultPtr, 2), 0x3d3d) }
            case 2 { mstore8(sub(resultPtr, 1), 0x3d) }
        }

        return result;
    }
}
