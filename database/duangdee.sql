-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: duangdee
-- ------------------------------------------------------
-- Server version	9.0.0

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
  `Card_Score` tinyint DEFAULT NULL,
  PRIMARY KEY (`Card_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card`
--

LOCK TABLES `card` WRITE;
/*!40000 ALTER TABLE `card` DISABLE KEYS */;
/*!40000 ALTER TABLE `card` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playcard`
--

DROP TABLE IF EXISTS `playcard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playcard` (
  `PlayCard_ID` tinyint NOT NULL AUTO_INCREMENT,
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
INSERT INTO `users` VALUES (1,'admin','$2b$14$L7BTzihH4JZrV5BZoOPVqugJNvU/RVn.ig9EtkqOKavSm7sGmXAUm','admin','Duangdee','Deemak','duangdee.app@gmail.com','0922957363','1975-01-01','2024-10-02 20:03:20','/images/profile-images/52b78f61-f14e-4125-8937-985a2e549bf6.jpg',NULL,3,1,1,1);
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
  `Zodiac_ID` int NOT NULL AUTO_INCREMENT,
  `Zodiac_Name` varchar(127) NOT NULL,
  `Zodiac_Detail` varchar(511) DEFAULT NULL,
  `Zodiac_ImageFile` varchar(255) DEFAULT NULL,
  `Zodiac_WorkTopic` varchar(511) DEFAULT NULL,
  `Zodiac_FinanceTopic` varchar(511) DEFAULT NULL,
  `Zodiac_LoveTopic` varchar(511) DEFAULT NULL,
  `Zodiac_Score` tinyint DEFAULT NULL,
  PRIMARY KEY (`Zodiac_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zodiac`
--

LOCK TABLES `zodiac` WRITE;
/*!40000 ALTER TABLE `zodiac` DISABLE KEYS */;
INSERT INTO `zodiac` VALUES (1,'ราศีเมษ','ผู้ที่เกิดวันที่ 13เม.ย. - 14พ.ค.','/images/zodiac-images/d85a313d-099d-4b26-a5f0-81a7f6800875.png','มักจะเป็นผู้นำที่ดี','มีแนวโน้มใช้จ่ายอย่างไร้เหตุผล','รักที่จริงจังและมีความรุ่มร้อน',80),(2,'ราศีพฤษภ','ผู้ที่เกิดวันที่ 15พ.ค. - 14มิ.ย.','/images/zodiac-images/f67f60e8-dd5b-4bda-9798-a0e37b21e400.png','ทำงานอย่างมีระเบียบ','มีแนวโน้มบริหารเงินได้ดี','รักที่มั่นคงและภักดี',70),(3,'ราศีเมถุน','ผู้ที่เกิดวันที่ 15มิ.ย. - 14ก.ค.','/images/zodiac-images/9e92649c-c74d-4b95-a902-e24f4cbd63d6.png','ทำงานได้ดีในทีม','มักจะมีรายได้จากหลายทาง','รักที่ตื่นเต้นและเปลี่ยนแปลง',75),(4,'ราศีกรกฎ','ผู้ที่เกิดวันที่ 15ก.ค. - 15ส.ค.','/images/zodiac-images/e7a239a6-f61b-48f0-a7a6-3df97e8a307d.png','ทำงานในสายช่วยเหลือได้ดี','มักจะมีการออมเงินที่ดี','รักที่มีความลึกซึ้ง',70),(5,'ราศีสิงห์','ผู้ที่เกิดวันที่ 16ส.ค. - 16ก.ย.','/images/zodiac-images/723694a7-96e7-4949-9a93-4da231e23bee.png','มักเป็นผู้นำและมีอิทธิพล','ใช้จ่ายตามอารมณ์','รักที่เต็มไปด้วยความโรแมนติก',90),(6,'ราศีกันย์','ผู้ที่เกิดวันที่ 17ก.ย. - 16ต.ค.','/images/zodiac-images/a458aa9c-a597-4705-a1f1-a3843ec41898.png','ทำงานได้อย่างมีประสิทธิภาพ','บริหารเงินอย่างรอบคอบ','รักที่มีความเอาใจใส่',75),(7,'ราศีตุลย์','ผู้ที่เกิดวันที่ 17ต.ค. - 15พ.ย.','/images/zodiac-images/67f14543-3e84-43b9-907f-8d7fdf275074.png','ทำงานได้ดีในสภาพแวดล้อมที่กลมเกลียว','มักมีความคิดในการลงทุน','รักที่มีความโรแมนติกและเต็มไปด้วยเสน่ห์',85),(8,'ราศีพิจิก','ผู้ที่เกิดวันที่ 16พ.ย. - 15ธ.ค.','/images/zodiac-images/7e9042a5-465b-4c1e-b6fc-4aaae71109fa.png','ทำงานได้ดีในสายลับหรือการสืบสวน','มีความสามารถในการลงทุน','รักที่มีความเข้มข้น',95),(9,'ราศีธนู','ผู้ที่เกิดวันที่ 16ธ.ค. - 14ม.ค.','/images/zodiac-images/ca601217-8c65-47a9-892e-480f8fc39bbf.png','ชอบงานที่มีความท้าทาย','ใช้จ่ายตามอารมณ์','รักที่มีอิสระและเปิดกว้าง',65),(10,'ราศีมังกร','ผู้ที่เกิดวันที่ 15ม.ค. - 12ก.พ.','/images/zodiac-images/ccfef4c9-7d2a-4bb9-b166-4c22223c6cd6.png','ทำงานได้ดีในตำแหน่งสูง','มักมีความสามารถในการวางแผนทางการเงิน','รักที่มั่นคงและมีความรับผิดชอบ',80),(11,'ราศีกุมภ์','ผู้ที่เกิดวันที่ 13ก.พ. - 14มี.ค.','/images/zodiac-images/8f98b8b1-24da-4c8c-b300-021b867d68ed.png','ทำงานในสายที่ต้องการนวัตกรรม','มีความคิดที่แปลกใหม่ในการลงทุน','รักที่มีความเป็นอิสระ',65),(12,'ราศีมีน','ผู้ที่เกิดวันที่ 15มี.ค. - 12เม.ย.','/images/zodiac-images/d4c99c84-a6d1-4712-a840-e6b8af9c3a46.png','ทำงานในด้านศิลปะและการสร้างสรรค์','มีความคิดสร้างสรรค์ในการบริหารเงิน','รักที่มีความโรแมนติก',90);
/*!40000 ALTER TABLE `zodiac` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'duangdee'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-10-02 20:44:20
