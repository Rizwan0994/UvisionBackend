const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

exports.CreateExcelData = async (fileName, workSheetNames, workSheetData) => {
    try {
        if (!fileName) {
            throw new Error("Enter valid file Name or its null value passed");
        }
        if (workSheetNames.length != workSheetData.length) {
            throw new Error("WorkSheetNames and workSheetData length should be same");
        }
        const newWb = xlsx.utils.book_new();
        for (let i = 0; i < workSheetNames.length; i++) {
            let info = JSON.parse(JSON.stringify(workSheetData[i]));
            const xlsxData = xlsx.utils.json_to_sheet(info);
            xlsx.utils.book_append_sheet(newWb, xlsxData, workSheetNames[i]);
        }
        // create file in public/xlsx/ folder 
        // xlsx.writeFile(newWb, path.join(__dirname, "../public/xlsx", fileName));
        // return newWb;

        // store in memory buffer
        const buf = xlsx.write(newWb, { type:"buffer", bookType:"xlsx" });
        return buf;
    } catch (error) {
        console.log('error :>> ', error);
    }
}

exports.deleteFile = (fileName) => {
    try {
        fs.unlinkSync(path.join(__dirname, "../public/xlsx", fileName));
        console.log("Delete File successfully.");
      } catch (error) {
        console.log(error);
      }
}

exports.getExcelData = async(FileName) => {
    try {
        let userInfo = []
        const filePath = path.join(__dirname, "../public/xlsx", FileName);
        const ws = xlsx.readFile(filePath);

        // select sheet example :  Sheet1, Sheet2
        const sheets = ws.SheetNames;

        for (let i = 0; i < sheets.length; i++) {
            //get xls file and tranfer to json format 
            // const data = xlsx.utils.sheet_to_json(sheet);

            //get xls file and tranfer to html format 
            // const data = xlsx.utils.sheet_to_html(sheet);
            const temp = xlsx.utils.sheet_to_json(ws.Sheets[ws.SheetNames[i]]);
            temp.forEach((res) => {
                userInfo.push(res);
            });
        }
        return userInfo;
    } catch (error) {
        throw new Error(error);
    }
}