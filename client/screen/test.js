export async function runTest(title, callback) {
  try {
    const result = await callback();

    if (typeof printResult === "function") {
      printResult(title, result);
    }

    return result;
  } catch (error) {
    const errorResult = {
      success: false,
      message: error.message,
      stack: error.stack,
    };

    if (typeof printResult === "function") {
      printResult(title + " - 예외 발생", errorResult);
    }

    return errorResult;
  }
}
