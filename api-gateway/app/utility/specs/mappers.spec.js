import _ from "lodash";

import { mapKeys, mapNameToTitle, mapValue, transformKeys, camelize } from "../mappers";

describe("mappers", () => {
  describe("mapKeys", () => {
    it("transforms object with mapping", () => {
      const input = { old_name: "a", another_name: "b", extra_attribute: "c" };
      const mapping = { old_name: "new_name", another_name: null };

      expect(mapKeys(mapping)(input)).toEqual({
        new_name: "a",
        another_name: "b",
      });
    });

    it("transforms array of objects with given mapping", () => {
      const input = [
        { old_name: "a", another_name: "b", extra_attribute: "c" },
        { old_name: "x", another_name: "y", extra_attribute: "z" },
      ];
      const mapping = { old_name: "new_name", another_name: null };

      expect(mapKeys(mapping)(input)).toEqual([
        { new_name: "a", another_name: "b" },
        { new_name: "x", another_name: "y" },
      ]);
    });
  });

  describe("mapNameToTitle", () => {
    it("transforms object", () => {
      const input = { name: "Sue", extra_attribute: "c" };

      expect(mapNameToTitle()(input)).toEqual({
        title: "Sue",
        extra_attribute: "c",
      });
    });

    it("does not overwrite title if already transformed", () => {
      const input = { title: "Sue", extra_attribute: "c" };

      expect(mapNameToTitle()(input)).toEqual({
        title: "Sue",
        extra_attribute: "c",
      });
    });

    it("transforms with different name key", () => {
      const input = { moniker: "Sue", extra_attribute: "c" };

      expect(mapNameToTitle("moniker")(input)).toEqual({
        title: "Sue",
        extra_attribute: "c",
      });
    });

    it("transforms array of objects", () => {
      const input = [
        { name: "Sue", extra_attribute: "c" },
        { name: "Mel", extra_attribute: "c" },
      ];

      expect(mapNameToTitle()(input)).toEqual([
        { title: "Sue", extra_attribute: "c" },
        { title: "Mel", extra_attribute: "c" },
      ]);
    });
  });

  describe("mapValue", () => {
    const valueMapping = {
      red: "#F00",
      green: "#0F0",
      blue: "#00F",
    };

    it("transforms value in object with mapping", () => {
      const input = {
        color: "red",
        icon: "mountain",
      };

      expect(mapValue("color", valueMapping)(input)).toEqual({
        color: "#F00",
        icon: "mountain",
      });
    });

    it("transforms value array of objects with given mapping", () => {
      const input = [
        { color: "red", icon: "mountain" },
        { color: "green", icon: "leaf" },
      ];

      expect(mapValue("color", valueMapping)(input)).toEqual([
        { color: "#F00", icon: "mountain" },
        { color: "#0F0", icon: "leaf" },
      ]);
    });
  });

  describe("transformKeys", () => {
    describe("snakeCase", () => {
      describe("on object", () => {
        const input = {
          helloThereMister: [
            {
              whatIf: "strings",
              omittedPath: 0.9,
            },
          ],
        };

        it("converts deep objects", () => {
          expect(transformKeys(_.snakeCase)()(input)).toEqual({
            hello_there_mister: [
              {
                what_if: "strings",
                omitted_path: 0.9,
              },
            ],
          });
        });

        it("allows omissions", () => {
          expect(transformKeys(_.snakeCase)(["helloThereMister.omittedPath"])(input)).toEqual({
            hello_there_mister: [
              {
                what_if: "strings",
                omittedPath: 0.9,
              },
            ],
          });
        });
      });

      describe("on array", () => {
        const input = [
          {
            helloDarkness: "my old friend",
            programmingLanguage: {
              name: "rust",
              isFun: true,
              isFast: true,
              difficultyScale: 0.7,
            },
          },
          {
            helloDarkness: "I've come to talk with you again",
            programmingLanguage: {
              name: "python",
              isFun: true,
              isFast: false,
              difficultyScale: 0.2,
            },
          },
        ];

        it("camelizes each item in list deeply", () => {
          expect(transformKeys(_.snakeCase)()(input)).toEqual([
            {
              hello_darkness: "my old friend",
              programming_language: {
                name: "rust",
                is_fun: true,
                is_fast: true,
                difficulty_scale: 0.7,
              },
            },
            {
              hello_darkness: "I've come to talk with you again",
              programming_language: {
                name: "python",
                is_fun: true,
                is_fast: false,
                difficulty_scale: 0.2,
              },
            },
          ]);
        });

        it("allows omissions", () => {
          expect(
            transformKeys(_.snakeCase)(["programmingLanguage.isFun", "programmingLanguage.isFast"])(input)
          ).toEqual([
            {
              hello_darkness: "my old friend",
              programming_language: {
                name: "rust",
                isFun: true,
                isFast: true,
                difficulty_scale: 0.7,
              },
            },
            {
              hello_darkness: "I've come to talk with you again",
              programming_language: {
                name: "python",
                isFun: true,
                isFast: false,
                difficulty_scale: 0.2,
              },
            },
          ]);
        });
      });
    });
  });

  describe("camelize", () => {
    describe("on object", () => {
      const input = {
        hello_there_mister: [
          {
            what_if: "strings",
            omitted_path: 0.9,
          },
        ],
      };

      it("camelizes deep objects", () => {
        expect(camelize()(input)).toEqual({
          helloThereMister: [
            {
              whatIf: "strings",
              omittedPath: 0.9,
            },
          ],
        });
      });

      it("allows omissions", () => {
        expect(camelize(["hello_there_mister.omitted_path"])(input)).toEqual({
          helloThereMister: [
            {
              whatIf: "strings",
              omitted_path: 0.9,
            },
          ],
        });
      });
    });

    describe("on array", () => {
      const input = [
        {
          hello_darkness: "my old friend",
          programming_language: {
            name: "rust",
            is_fun: true,
            is_fast: true,
            difficulty_scale: 0.7,
          },
        },
        {
          hello_darkness: "I've come to talk with you again",
          programming_language: {
            name: "python",
            is_fun: true,
            is_fast: false,
            difficulty_scale: 0.2,
          },
        },
      ];

      it("camelizes each item in list deeply", () => {
        expect(camelize()(input)).toEqual([
          {
            helloDarkness: "my old friend",
            programmingLanguage: {
              name: "rust",
              isFun: true,
              isFast: true,
              difficultyScale: 0.7,
            },
          },
          {
            helloDarkness: "I've come to talk with you again",
            programmingLanguage: {
              name: "python",
              isFun: true,
              isFast: false,
              difficultyScale: 0.2,
            },
          },
        ]);
      });

      it("allows omissions", () => {
        expect(
          camelize(["programming_language.is_fun", "programming_language.is_fast"])(input)
        ).toEqual([
          {
            helloDarkness: "my old friend",
            programmingLanguage: {
              name: "rust",
              is_fun: true,
              is_fast: true,
              difficultyScale: 0.7,
            },
          },
          {
            helloDarkness: "I've come to talk with you again",
            programmingLanguage: {
              name: "python",
              is_fun: true,
              is_fast: false,
              difficultyScale: 0.2,
            },
          },
        ]);
      });
    });
  });
});
