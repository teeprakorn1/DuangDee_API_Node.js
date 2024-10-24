-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: duangdee
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `card`
--

DROP TABLE IF EXISTS `card`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card` (
  `Card_ID` tinyint NOT NULL AUTO_INCREMENT,
  `Card_Name` varchar(127) NOT NULL,
  `Card_ImageFile` varchar(255) DEFAULT NULL,
  `Card_WorkTopic` varchar(511) DEFAULT NULL,
  `Card_FinanceTopic` varchar(511) DEFAULT NULL,
  `Card_LoveTopic` varchar(511) DEFAULT NULL,
  `Card_WorkScore` float DEFAULT NULL,
  `Card_FinanceScore` float DEFAULT NULL,
  `Card_LoveScore` float DEFAULT NULL,
  PRIMARY KEY (`Card_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card`
--

LOCK TABLES `card` WRITE;
/*!40000 ALTER TABLE `card` DISABLE KEYS */;
INSERT INTO `card` VALUES (1,'The Fool','/images/card-images/e9345ffe-15da-4949-978d-a034ac52b44e.png','การเริ่มต้นใหม่ที่เต็มไปด้วยความหวังและการผจญภัย การเดินทางในเส้นทางที่ไม่รู้จักทำให้คุณเรียนรู้และเติบโต','โอกาสในการลงทุนใหม่ที่อาจจะมีความเสี่ยงสูง แต่ผลตอบแทนอาจจะคุ้มค่า','ความรักที่สดใสและเต็มไปด้วยความตื่นเต้น พร้อมที่จะสำรวจสิ่งใหม่ๆ ร่วมกัน',10,10,10),(2,'The Magician','/images/card-images/a89e456f-6918-4288-9d9d-a6ebd7c46652.png','การใช้ทักษะและความสามารถในการสร้างสรรค์สิ่งใหม่ ๆ เปลี่ยนความคิดให้เป็นความจริงและนำพาความสำเร็จ','ความสามารถในการทำเงินผ่านการทำงานหนักและการใช้ความคิดสร้างสรรค์เพื่อให้ประสบผล','ความรักที่สร้างสรรค์และมีพลัง ทำให้คุณและคู่รักสามารถสร้างสิ่งใหม่ ๆ ร่วมกันได้',20,20,20),(3,'The High Priestess','/images/card-images/205dc553-f020-4b1d-a664-1b19485bcdd7.png','การเข้าใจตนเองอย่างลึกซึ้ง การมองหาความรู้ภายในและการทำความเข้าใจเกี่ยวกับชีวิต','การวิเคราะห์สถานการณ์การเงินอย่างรอบคอบและการเข้าใจแนวโน้มที่เกิดขึ้น','ความรักที่ลึกซึ้งและเป็นความสัมพันธ์ที่ต้องการการสื่อสารอย่างจริงใจ',30,30,30),(4,'The Empress','/images/card-images/ab87d1da-a89a-41ce-8e2d-bbce2daeb462.png','การสร้างสรรค์และการดูแลเอาใจใส่ ช่วยให้เกิดความเจริญในอาชีพและสร้างสภาพแวดล้อมที่ดี','ความเจริญรุ่งเรืองที่เกิดจากการลงทุนอย่างชาญฉลาดและการวางแผนทางการเงินที่รอบคอบ','ความรักที่มั่นคงและเสริมสร้างพลังใจให้กันและกัน โดยเฉพาะในช่วงเวลาที่ท้าทาย',40,40,40),(5,'The Emperor','/images/card-images/9b496fb1-8ced-4bb8-9b47-03dd40a30054.png','การเป็นผู้นำที่มีวิสัยทัศน์และการสร้างกลยุทธ์เพื่อให้เกิดความสำเร็จในอาชีพ','การบริหารจัดการเงินอย่างมีประสิทธิภาพ รวมถึงการวางแผนทางการเงินที่ชัดเจน','ความรักที่มีความรับผิดชอบและมุ่งมั่นที่จะสร้างอนาคตที่ดีร่วมกัน',50,50,50),(6,'The Hierophant','/images/card-images/ee42e244-a6f7-4b24-acea-7e5dc16dc12b.png','การเรียนรู้จากประสบการณ์และการสืบสานวัฒนธรรม การเข้าใจความหมายของชีวิต','การลงทุนระยะยาวที่มีความเสี่ยงต่ำเพื่อสร้างความมั่นคงทางการเงินในอนาคต','ความรักที่มีพื้นฐานและมั่นคง สามารถผ่านอุปสรรคและความท้าทายได้',60,60,60),(7,'The Lovers','/images/card-images/e3898973-83b2-499b-a7e7-8de557078d65.png','การเลือกและการตัดสินใจที่สำคัญในชีวิต โดยเฉพาะในเรื่องความรักและความสัมพันธ์','การตัดสินใจทางการเงินที่มีผลกระทบต่อชีวิต การเลือกลงทุนที่ถูกต้องในช่วงเวลาที่เหมาะสม','ความรักที่เป็นอันหนึ่งอันเดียวกัน โดยมีการสนับสนุนและเข้าใจกันเป็นอย่างดี',70,70,70),(8,'The Chariot','/images/card-images/1ea01b9a-4c12-41b6-b613-f0be62c23377.png','การมุ่งมั่นและการพยายามที่จะประสบความสำเร็จ ผ่านอุปสรรคและความท้าทาย','การควบคุมการเงินอย่างมีประสิทธิภาพ เพื่อให้บรรลุเป้าหมายที่ตั้งไว้','ความรักที่มีพลังและความมุ่งมั่นที่จะทำให้ความสัมพันธ์ดีขึ้นเรื่อย ๆ',80,80,80),(9,'Strength','/images/card-images/758169b2-7966-47a5-a570-0752b4fc6910.png','ความแข็งแกร่งในการเผชิญหน้ากับความท้าทายและการทำงานร่วมกับผู้อื่น','การจัดการหนี้สินอย่างมีระเบียบและการวางแผนเพื่อความมั่นคงทางการเงิน','ความรักที่ต้องการการสนับสนุนจากกันและกันในช่วงเวลาที่ยากลำบาก',90,90,90),(10,'The Hermit','/images/card-images/1b994d67-983b-4552-9525-67e29296136c.png','การค้นหาความหมายและการพิจารณาตนเองในช่วงเวลาที่เงียบสงบ','การลงทุนที่มีความเสี่ยงต่ำ เพื่อสร้างความมั่นคงทางการเงินในอนาคต','ความรักที่เงียบสงบและมีความเข้าใจในตัวตนของกันและกัน',20,20,20),(11,'Wheel of Fortune','/images/card-images/44c51913-2d06-4c23-a170-aec07176e841.png','โชคลาภที่เปลี่ยนแปลงได้ตลอดเวลา การยอมรับโชคชะตาและความไม่แน่นอนในชีวิต','การเงินที่ไม่แน่นอน อาจมีการเปลี่ยนแปลงในอนาคตที่ต้องเตรียมตัวรับมือ','ความรักที่เปลี่ยนแปลงตามสถานการณ์ ทำให้ต้องปรับตัวเพื่อรักษาความสัมพันธ์',100,100,100),(12,'Justice','/images/card-images/a39aa7c1-12e6-4e47-aa9f-5c969da640b4.png','ความยุติธรรมในการตัดสินใจและการปฏิบัติตนในอาชีพ','การบริหารการเงินอย่างมีระเบียบ โดยคำนึงถึงความเป็นธรรมและความยุติธรรม','ความรักที่มีความเท่าเทียมกัน โดยไม่มีการใช้ประโยชน์ซึ่งกันและกัน',60,60,60),(13,'The Hanged Man','/images/card-images/ae77248c-31c4-436a-a41f-0a272d1a15af.png','การรอคอยและการพิจารณาทุกด้านก่อนการตัดสินใจที่สำคัญ','การลงทุนที่ต้องการความอดทนและการมองการณ์ไกลเพื่อให้ประสบความสำเร็จ','ความรักที่ต้องการการปรับตัวและการเข้าใจซึ่งกันและกันในช่วงเวลาที่ยากลำบาก',30,30,30),(14,'Death','/images/card-images/77c78106-ec19-43ed-b442-0a41db2184af.png','การเปลี่ยนแปลงและการเริ่มต้นใหม่ที่สำคัญในชีวิต การปล่อยวางจากอดีต','การเปลี่ยนแปลงทางการเงินที่อาจส่งผลต่อชีวิต ต้องเตรียมตัวรับมือกับการเปลี่ยนแปลง','ความรักที่ต้องการการสิ้นสุดเพื่อเริ่มต้นสิ่งใหม่ ๆ ที่ดีกว่า',10,10,10),(15,'Temperance','/images/card-images/42c6cc87-7bb3-450a-b3df-b2d589603d83.png','ความสมดุลในชีวิต การจัดการระหว่างความต้องการและความจำเป็น','การควบคุมค่าใช้จ่ายเพื่อให้มีเสถียรภาพทางการเงินในอนาคต','ความรักที่มีความสมดุลและช่วยเสริมสร้างกันและกัน',50,50,50),(16,'The Devil','/images/card-images/bfe16956-f9b1-4485-85d3-a7e4bfedcf9c.png','การหลงใหลในสิ่งที่ไม่ดี อาจทำให้เกิดความขัดแย้งในชีวิต','การใช้จ่ายเกินความจำเป็น อาจนำไปสู่ปัญหาทางการเงินที่ร้ายแรง','ความรักที่มีความเสพติด โดยอาจทำให้รู้สึกติดอยู่ในวงจรที่ไม่ดี',20,20,20);
/*!40000 ALTER TABLE `card` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `handdetail`
--

DROP TABLE IF EXISTS `handdetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `handdetail` (
  `HandDetail_ID` tinyint NOT NULL AUTO_INCREMENT,
  `HandDetail_Name` varchar(127) DEFAULT NULL,
  `HandDetail_Detail` varchar(511) DEFAULT NULL,
  `HandDetail_MinPercent` float DEFAULT NULL,
  PRIMARY KEY (`HandDetail_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `handdetail`
--

LOCK TABLES `handdetail` WRITE;
/*!40000 ALTER TABLE `handdetail` DISABLE KEYS */;
INSERT INTO `handdetail` VALUES (1,'โชคไม่ดีอย่างมาก','ในช่วงนี้ดูเหมือนว่าชีวิตจะเต็มไปด้วยอุปสรรคและความยากลำบาก มีการเปลี่ยนแปลงที่ไม่คาดคิดเข้ามาเสมอ ความเครียดอาจส่งผลต่อสุขภาพจิตของคุณได้ ควรระมัดระวังการตัดสินใจในทุกเรื่อง หมั่นหาความสงบให้กับตัวเอง.',0),(2,'โชคไม่ค่อยดี','การทำงานหรือการเรียนอาจไม่ราบรื่นเหมือนที่หวังไว้ ความเครียดจากภายนอกอาจส่งผลต่อสภาพจิตใจ คุณอาจรู้สึกท้อแท้หรือหมดกำลังใจได้ ควรหาวิธีบำบัดหรือทำกิจกรรมที่ช่วยคลายเครียด มีคนรอบข้างที่พร้อมให้การสนับสนุน.',10),(3,'โชคไม่ดีพอสมควร','ชีวิตในช่วงนี้อาจมีเรื่องที่ทำให้ไม่สบายใจ แต่ก็ยังมีโอกาสดี ๆ รออยู่ข้างหน้า อย่าลืมมองหาความหวังและใช้เวลาที่มีอย่างเต็มที่ ความเข้มแข็งภายในจะช่วยให้คุณฝ่าฟันอุปสรรคไปได้ ควรทำใจให้สบายและเปิดใจรับประสบการณ์ใหม่ ๆ.',20),(4,'โชคเริ่มดีขึ้นเล็กน้อย','การเปลี่ยนแปลงที่ดีเริ่มปรากฏขึ้นในชีวิตของคุณ มีโอกาสใหม่ ๆ รออยู่ข้างหน้า ควรใช้โอกาสนี้ให้เต็มที่เพื่อสร้างความก้าวหน้า ความมุ่งมั่นของคุณจะนำไปสู่ผลลัพธ์ที่ดีขึ้น อย่าลืมขอบคุณสิ่งดี ๆ ที่เข้ามาในชีวิต.',30),(5,'โชคกลาง ๆ','ชีวิตดูจะเป็นไปตามปกติ ไม่มีเรื่องใหญ่ ๆ ที่จะเข้ามากวนใจ การตัดสินใจในช่วงนี้อาจต้องใช้ความรอบคอบมากขึ้น มีโอกาสในการทำสิ่งใหม่ ๆ แต่ก็ควรเตรียมรับมือกับปัญหาที่อาจเกิดขึ้น หมั่นวางแผนเพื่อให้การดำเนินชีวิตมีประสิทธิภาพมากขึ้น.',40),(6,'โชคค่อนข้างดี','ในช่วงนี้คุณจะรู้สึกถึงความสุขที่มากขึ้น มีสิ่งดี ๆ เข้ามาในชีวิต ทำให้คุณมีแรงจูงใจในการพัฒนาตนเอง สิ่งที่ทำมาจะเริ่มให้ผลดี และควรใช้โอกาสนี้ในการเรียนรู้จากประสบการณ์.',50),(7,'โชคดีพอสมควร','คุณจะได้รับการสนับสนุนจากคนรอบข้าง ทำให้การดำเนินชีวิตมีความราบรื่นมากขึ้น ควรเปิดใจรับโอกาสที่เข้ามา มีความสุขเล็ก ๆ น้อย ๆ ที่ทำให้ชีวิตดูมีสีสันมากขึ้น ควรเก็บเกี่ยวประสบการณ์เหล่านี้ให้ได้มากที่สุด.',60),(8,'โชคดีมาก','ช่วงนี้จะมีเหตุการณ์ที่ดีเกิดขึ้นในชีวิตของคุณ อาจมีข่าวดีจากงานหรือการเรียน ที่จะทำให้คุณรู้สึกมีความสุข ควรใช้เวลานี้ให้เต็มที่และหมั่นมองหาโอกาสใหม่ ๆ ที่เข้ามา มีคนที่คอยสนับสนุนคุณอย่างเต็มที่.',70),(9,'โชคดีมาก ๆ','ความพยายามที่ผ่านมาจะเริ่มให้ผล มีโอกาสที่ดีในการพัฒนาตนเอง อย่าลืมขอบคุณสิ่งดี ๆ ที่เข้ามาในชีวิต ทำให้คุณรู้สึกมีแรงบันดาลใจในการก้าวไปข้างหน้า ช่วงนี้ควรตั้งใจทำสิ่งที่รักให้เต็มที่.',80),(10,'โชคดีอย่างที่สุด','ในช่วงนี้ชีวิตดูเหมือนจะเต็มไปด้วยความโชคดี การเงินและความสัมพันธ์มีแนวโน้มที่ดี ควรใช้เวลานี้ให้เต็มที่และขอบคุณทุกสิ่งที่มี ทุกอย่างที่คุณทำจะเป็นไปตามที่หวัง อย่าลืมแบ่งปันความสุขกับคนรอบข้าง.',90);
/*!40000 ALTER TABLE `handdetail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playcard`
--

DROP TABLE IF EXISTS `playcard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playcard` (
  `PlayCard_ID` int NOT NULL AUTO_INCREMENT,
  `PlayCard_RegisDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `Users_ID` int DEFAULT NULL,
  `Card_ID` tinyint DEFAULT NULL,
  PRIMARY KEY (`PlayCard_ID`),
  KEY `Users_ID` (`Users_ID`),
  KEY `Card_ID` (`Card_ID`),
  CONSTRAINT `playcard_ibfk_1` FOREIGN KEY (`Users_ID`) REFERENCES `users` (`Users_ID`),
  CONSTRAINT `playcard_ibfk_2` FOREIGN KEY (`Card_ID`) REFERENCES `card` (`Card_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playcard`
--

LOCK TABLES `playcard` WRITE;
/*!40000 ALTER TABLE `playcard` DISABLE KEYS */;
/*!40000 ALTER TABLE `playcard` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playhand`
--

DROP TABLE IF EXISTS `playhand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playhand` (
  `PlayHand_ID` int NOT NULL AUTO_INCREMENT,
  `PlayHand_RegisDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `PlayHand_ImageFile` varchar(255) DEFAULT NULL,
  `PlayHand_Score` float DEFAULT NULL,
  `Users_ID` int DEFAULT NULL,
  `HandDetail_ID` tinyint DEFAULT NULL,
  PRIMARY KEY (`PlayHand_ID`),
  KEY `Users_ID` (`Users_ID`),
  KEY `HandDetail_ID` (`HandDetail_ID`),
  CONSTRAINT `playhand_ibfk_1` FOREIGN KEY (`Users_ID`) REFERENCES `users` (`Users_ID`),
  CONSTRAINT `playhand_ibfk_2` FOREIGN KEY (`HandDetail_ID`) REFERENCES `handdetail` (`HandDetail_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playhand`
--

LOCK TABLES `playhand` WRITE;
/*!40000 ALTER TABLE `playhand` DISABLE KEYS */;
/*!40000 ALTER TABLE `playhand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registype`
--

DROP TABLE IF EXISTS `registype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registype` (
  `RegisType_ID` tinyint NOT NULL AUTO_INCREMENT,
  `RegisType_Name` varchar(127) NOT NULL,
  PRIMARY KEY (`RegisType_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registype`
--

LOCK TABLES `registype` WRITE;
/*!40000 ALTER TABLE `registype` DISABLE KEYS */;
INSERT INTO `registype` VALUES (1,'GENERAL'),(2,'GMAIL');
/*!40000 ALTER TABLE `registype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `summary`
--

DROP TABLE IF EXISTS `summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `summary` (
  `Summary_ID` int NOT NULL AUTO_INCREMENT,
  `Summary_TotalScore` float DEFAULT NULL,
  `Summary_RegisDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `Users_ID` int DEFAULT NULL,
  `Zodiac_ID` tinyint DEFAULT NULL,
  `PlayCard_ID` int DEFAULT NULL,
  `PlayHand_ID` int DEFAULT NULL,
  `SummaryDetail_ID` tinyint DEFAULT NULL,
  PRIMARY KEY (`Summary_ID`),
  KEY `Users_ID` (`Users_ID`),
  KEY `Zodiac_ID` (`Zodiac_ID`),
  KEY `PlayCard_ID` (`PlayCard_ID`),
  KEY `PlayHand_ID` (`PlayHand_ID`),
  KEY `SummaryDetail_ID` (`SummaryDetail_ID`),
  CONSTRAINT `summary_ibfk_1` FOREIGN KEY (`Users_ID`) REFERENCES `users` (`Users_ID`),
  CONSTRAINT `summary_ibfk_2` FOREIGN KEY (`Zodiac_ID`) REFERENCES `zodiac` (`Zodiac_ID`),
  CONSTRAINT `summary_ibfk_3` FOREIGN KEY (`PlayCard_ID`) REFERENCES `playcard` (`PlayCard_ID`),
  CONSTRAINT `summary_ibfk_4` FOREIGN KEY (`PlayHand_ID`) REFERENCES `playhand` (`PlayHand_ID`),
  CONSTRAINT `summary_ibfk_5` FOREIGN KEY (`SummaryDetail_ID`) REFERENCES `summarydetail` (`SummaryDetail_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `summary`
--

LOCK TABLES `summary` WRITE;
/*!40000 ALTER TABLE `summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `summarydetail`
--

DROP TABLE IF EXISTS `summarydetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `summarydetail` (
  `SummaryDetail_ID` tinyint NOT NULL AUTO_INCREMENT,
  `SummaryDetail_Name` varchar(127) DEFAULT NULL,
  `SummaryDetail_Detail` varchar(511) DEFAULT NULL,
  `SummaryDetail_MinPercent` float DEFAULT NULL,
  PRIMARY KEY (`SummaryDetail_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `summarydetail`
--

LOCK TABLES `summarydetail` WRITE;
/*!40000 ALTER TABLE `summarydetail` DISABLE KEYS */;
INSERT INTO `summarydetail` VALUES (1,'โชคไม่ดีอย่างมาก','ในช่วงเวลานี้ คุณอาจต้องเผชิญกับอุปสรรคและปัญหาที่รุนแรงมาก มีการเปลี่ยนแปลงที่ไม่คาดคิดเข้ามาในชีวิตซึ่งทำให้คุณรู้สึกท้อแท้และหมดกำลังใจ ควรพยายามหาความสงบและหาวิธีจัดการกับความเครียด รวมถึงการหาความช่วยเหลือจากคนใกล้ชิดเพื่อผ่านช่วงเวลานี้ไปให้ได้.',0),(2,'โชคไม่ค่อยดี','ชีวิตในช่วงนี้มีแนวโน้มที่จะมีความท้าทายมากขึ้น คุณอาจรู้สึกถึงความกดดันจากงานหรือการเรียน ซึ่งทำให้การทำงานหรือการเรียนรู้ดูไม่ราบรื่นเท่าที่ควร ควรใช้เวลาพักผ่อนและหากิจกรรมที่ช่วยให้คุณรู้สึกดีขึ้น เพื่อสร้างพลังใหม่ ๆ ให้กับตัวเอง.',10),(3,'โชคไม่ดีพอสมควร','แม้ว่าจะมีเรื่องราวที่ทำให้คุณรู้สึกไม่สบายใจอยู่บ้าง แต่ยังมีโอกาสดี ๆ รออยู่ข้างหน้า ความเข้มแข็งของคุณในช่วงนี้จะช่วยให้คุณสามารถผ่านพ้นปัญหาไปได้อย่างมีประสิทธิภาพ ควรหาวิธีเพื่อให้ตัวเองมีแรงจูงใจในการทำสิ่งที่รักและมองโลกในแง่ดี.',20),(4,'โชคเริ่มดีขึ้นเล็กน้อย','การเปลี่ยนแปลงที่ดีเริ่มเกิดขึ้นในชีวิตของคุณ การสนับสนุนจากคนรอบข้างเริ่มส่งผลบวกต่อความรู้สึกของคุณ คุณมีโอกาสที่จะเปลี่ยนแปลงสิ่งต่าง ๆ ในเชิงบวกได้มากขึ้น แต่อาจต้องใช้เวลาและความพยายามในการสร้างความมั่นใจในตัวเองให้กลับมา.',30),(5,'โชคกลาง ๆ','ในช่วงนี้ชีวิตดูเหมือนจะอยู่ในระดับที่กลาง ๆ ไม่มีเรื่องใหญ่ ๆ ที่จะทำให้คุณวิตกกังวลมากนัก แต่ก็ยังต้องการความพยายามในการปรับปรุงตัวเอง คุณควรตั้งเป้าหมายที่ชัดเจนในสิ่งที่คุณต้องการและทำงานอย่างมีระบบเพื่อให้ก้าวหน้าไปอีกขั้น.',40),(6,'โชคค่อนข้างดี','คุณเริ่มรู้สึกถึงความสุขและความสำเร็จเล็กน้อยในชีวิต ทุกอย่างเริ่มมีความคืบหน้าไปในทิศทางที่ดีขึ้น คุณควรใช้เวลานี้ในการพัฒนาตนเองและมองหาโอกาสในการทำสิ่งใหม่ ๆ ที่จะนำไปสู่ความสำเร็จในอนาคต.',50),(7,'โชคดีพอสมควร','ในช่วงนี้ คุณจะได้รับการสนับสนุนจากคนรอบข้างอย่างมาก ทำให้การดำเนินชีวิตดูราบรื่นมากขึ้น ควรเปิดรับโอกาสใหม่ ๆ ที่เข้ามาและพยายามทำให้ดีที่สุดในทุกสิ่งที่ทำ อาจจะมีเรื่องดี ๆ เข้ามาในชีวิตในไม่ช้านี้.',60),(8,'โชคดีมาก','ชีวิตของคุณในช่วงนี้มีแนวโน้มที่จะเต็มไปด้วยความสุขและความสำเร็จ มีโอกาสมากมายที่เข้ามา คุณควรใช้เวลานี้ให้เต็มที่และหมั่นสร้างความสัมพันธ์ที่ดีกับคนรอบข้าง เพราะทุกอย่างดูเหมือนจะไปได้ดี.',70),(9,'โชคดีมาก ๆ','ทุกสิ่งดูเหมือนจะเป็นไปตามที่คุณหวัง การเงินและความรักเป็นไปในทิศทางที่ดี คุณควรรักษาความรู้สึกดี ๆ นี้ให้คงอยู่ และพยายามทำให้ทุกวันมีความหมายด้วยการทำสิ่งที่คุณรัก.',80),(10,'โชคดีอย่างที่สุด','ในช่วงนี้ชีวิตของคุณดูเหมือนจะเต็มไปด้วยความสำเร็จและความสุข ควรแบ่งปันความโชคดีนี้กับคนรอบข้างและไม่ลืมขอบคุณสิ่งที่มี ทุกอย่างที่คุณทำจะเป็นไปตามที่หวัง ขอให้รักษาความมุ่งมั่นและมีความสุขในทุกย่างก้าวของชีวิต.',90);
/*!40000 ALTER TABLE `summarydetail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `Users_ID` int NOT NULL AUTO_INCREMENT,
  `Users_Username` varchar(127) DEFAULT NULL,
  `Users_Password` varchar(63) DEFAULT NULL,
  `Users_DisplayName` varchar(127) DEFAULT NULL,
  `Users_FirstName` varchar(127) DEFAULT NULL,
  `Users_LastName` varchar(127) DEFAULT NULL,
  `Users_Email` varchar(127) DEFAULT NULL,
  `Users_Phone` varchar(15) DEFAULT NULL,
  `Users_BirthDate` date DEFAULT NULL,
  `Users_RegisDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `Users_ImageFile` varchar(255) DEFAULT NULL,
  `Users_Google_Uid` varchar(127) DEFAULT NULL,
  `UsersGender_ID` tinyint DEFAULT '3',
  `RegisType_ID` tinyint NOT NULL DEFAULT '1',
  `UsersType_ID` tinyint NOT NULL DEFAULT '1',
  `Users_IsActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`Users_ID`),
  UNIQUE KEY `Users_ID` (`Users_ID`),
  UNIQUE KEY `Users_Username` (`Users_Username`),
  UNIQUE KEY `Users_Email` (`Users_Email`),
  UNIQUE KEY `Users_Google_Uid` (`Users_Google_Uid`),
  KEY `UsersGender_ID` (`UsersGender_ID`),
  KEY `RegisType_ID` (`RegisType_ID`),
  KEY `UsersType_ID` (`UsersType_ID`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`UsersGender_ID`) REFERENCES `usersgender` (`UsersGender_ID`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`RegisType_ID`) REFERENCES `registype` (`RegisType_ID`),
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`UsersType_ID`) REFERENCES `userstype` (`UsersType_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$14$ThZLTq1Rbtl2/zxeblBXduBE8tp9CEt2JEiQzz3UKMzdQrIUt.E.S','Duangdee Admin','Duang','Dee','duangdee.app@gmail.com','0922957363','1975-01-01','2024-10-25 01:56:25','/images/profile-images/e900157f-3454-48f4-8645-12ca3ca16878.jpg',NULL,3,1,1,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usersgender`
--

DROP TABLE IF EXISTS `usersgender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usersgender` (
  `UsersGender_ID` tinyint NOT NULL AUTO_INCREMENT,
  `UsersGender_Name` varchar(127) NOT NULL,
  PRIMARY KEY (`UsersGender_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usersgender`
--

LOCK TABLES `usersgender` WRITE;
/*!40000 ALTER TABLE `usersgender` DISABLE KEYS */;
INSERT INTO `usersgender` VALUES (1,'MALE'),(2,'FEMALE'),(3,'OTHER');
/*!40000 ALTER TABLE `usersgender` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userstype`
--

DROP TABLE IF EXISTS `userstype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userstype` (
  `UsersType_ID` tinyint NOT NULL AUTO_INCREMENT,
  `UsersType_Name` varchar(127) NOT NULL,
  PRIMARY KEY (`UsersType_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userstype`
--

LOCK TABLES `userstype` WRITE;
/*!40000 ALTER TABLE `userstype` DISABLE KEYS */;
INSERT INTO `userstype` VALUES (1,'USER'),(2,'ADMIN');
/*!40000 ALTER TABLE `userstype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zodiac`
--

DROP TABLE IF EXISTS `zodiac`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zodiac` (
  `Zodiac_ID` tinyint NOT NULL AUTO_INCREMENT,
  `Zodiac_Name` varchar(127) NOT NULL,
  `Zodiac_Detail` varchar(511) DEFAULT NULL,
  `Zodiac_ImageFile` varchar(255) DEFAULT NULL,
  `Zodiac_WorkTopic` varchar(511) DEFAULT NULL,
  `Zodiac_FinanceTopic` varchar(511) DEFAULT NULL,
  `Zodiac_LoveTopic` varchar(511) DEFAULT NULL,
  `Zodiac_Score` float DEFAULT NULL,
  PRIMARY KEY (`Zodiac_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zodiac`
--

LOCK TABLES `zodiac` WRITE;
/*!40000 ALTER TABLE `zodiac` DISABLE KEYS */;
INSERT INTO `zodiac` VALUES (1,'ราศีเมษ','ผู้ที่เกิดวันที่ 13เม.ย. - 14พ.ค.','/images/zodiac-images/bf458d51-a2ad-45e0-b4a7-9f1279c59a85.png','มักจะเป็นผู้นำที่ดี','มีแนวโน้มใช้จ่ายอย่างไร้เหตุผล','รักที่จริงจังและมีความรุ่มร้อน',80),(2,'ราศีพฤษภ','ผู้ที่เกิดวันที่ 15พ.ค. - 14มิ.ย.','/images/zodiac-images/90d5067f-eb43-4d23-bb2d-87011f0a70a1.png','ทำงานอย่างมีระเบียบ','มีแนวโน้มบริหารเงินได้ดี','รักที่มั่นคงและภักดี',70),(3,'ราศีเมถุน','ผู้ที่เกิดวันที่ 15มิ.ย. - 14ก.ค.','/images/zodiac-images/1acf7bb0-9fbb-4bb9-8ee5-71ad171163fd.png','ทำงานได้ดีในทีม','มักจะมีรายได้จากหลายทาง','รักที่ตื่นเต้นและเปลี่ยนแปลง',75),(4,'ราศีกรกฎ','ผู้ที่เกิดวันที่ 15ก.ค. - 15ส.ค.','/images/zodiac-images/51f1cc12-fba4-4a2c-b1c1-1e78a93b55e8.png','ทำงานในสายช่วยเหลือได้ดี','มักจะมีการออมเงินที่ดี','รักที่มีความลึกซึ้ง',70),(5,'ราศีสิงห์','ผู้ที่เกิดวันที่ 16ส.ค. - 16ก.ย.','/images/zodiac-images/b8db7014-3708-4996-92c5-c884dc428b3a.png','มักเป็นผู้นำและมีอิทธิพล','ใช้จ่ายตามอารมณ์','รักที่เต็มไปด้วยความโรแมนติก',90),(6,'ราศีกันย์','ผู้ที่เกิดวันที่ 17ก.ย. - 16ต.ค.','/images/zodiac-images/2b071d5e-e2e4-41be-99e7-c8ce985bfb02.png','ทำงานได้อย่างมีประสิทธิภาพ','บริหารเงินอย่างรอบคอบ','รักที่มีความเอาใจใส่',75),(7,'ราศีตุลย์','ผู้ที่เกิดวันที่ 17ต.ค. - 15พ.ย.','/images/zodiac-images/3ad3cb2b-403c-4c68-8254-2216d1d97d6b.png','ทำงานได้ดีในสภาพแวดล้อมที่กลมเกลียว','มักมีความคิดในการลงทุน','รักที่มีความโรแมนติกและเต็มไปด้วยเสน่ห์',85),(8,'ราศีพิจิก','ผู้ที่เกิดวันที่ 16พ.ย. - 15ธ.ค.','/images/zodiac-images/87266f0c-08f9-4825-855c-8257ebd9a392.png','ทำงานได้ดีในสายลับหรือการสืบสวน','มีความสามารถในการลงทุน','รักที่มีความเข้มข้น',95),(9,'ราศีธนู','ผู้ที่เกิดวันที่ 16ธ.ค. - 14ม.ค.','/images/zodiac-images/409c4663-50bd-4c4f-813d-f7b437dad46a.png','ชอบงานที่มีความท้าทาย','ใช้จ่ายตามอารมณ์','รักที่มีอิสระและเปิดกว้าง',65),(10,'ราศีมังกร','ผู้ที่เกิดวันที่ 15ม.ค. - 12ก.พ.','/images/zodiac-images/941c1dd9-d04c-40c5-b7f6-27b5ff0af5ed.png','ทำงานได้ดีในตำแหน่งสูง','มักมีความสามารถในการวางแผนทางการเงิน','รักที่มั่นคงและมีความรับผิดชอบ',80),(11,'ราศีกุมภ์','ผู้ที่เกิดวันที่ 13ก.พ. - 14มี.ค.','/images/zodiac-images/9796d8b1-c9c0-4d75-a9ba-46b6f6b34679.png','ทำงานในสายที่ต้องการนวัตกรรม','มีความคิดที่แปลกใหม่ในการลงทุน','รักที่มีความเป็นอิสระ',65),(12,'ราศีมีน','ผู้ที่เกิดวันที่ 15มี.ค. - 12เม.ย.','/images/zodiac-images/75574cea-5ece-48ee-815f-f88dc89673c1.png','ทำงานในด้านศิลปะและการสร้างสรรค์','มีความคิดสร้างสรรค์ในการบริหารเงิน','รักที่มีความโรแมนติก',90);
/*!40000 ALTER TABLE `zodiac` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-10-25  2:23:20
