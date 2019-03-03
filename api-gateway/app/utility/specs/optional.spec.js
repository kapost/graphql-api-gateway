import optional from "../optional";

describe("Optional", () => {
  describe("some", () => {
    it("#maybe", () => {
      expect(optional.some(4).maybe()).toBe(4);
    });

    it("#must", () => {
      expect(optional.some(4).must()).toBe(4);
    });

    describe("#match", () => {
      it("validates", () => {
        expect(() => optional.some(5).match()).toThrow();
        expect(() => optional.some(5).match({ Some: () => "x" })).toThrow();
        expect(() => optional.some(5).match({ None: () => "x" })).toThrow();
      });

      it("runs `Some` condition", () => {
        expect(
          optional.some(5).match({ Some: val => val + 1, None: () => 0 })
        ).toEqual(6);
      });
    });

    it("#orElse", () => {
      const opt = optional.some(3);
      expect(opt.orElse(optional.none)).toBe(opt);
    });

    it("#valueOrElse", () => {
      expect(optional.some(3).valueOrElse(100)).toBe(3);
    });

    it("#toArray", () => {
      expect(optional.some(3).toArray()).toEqual([3]);
    });

    it("#isSome", () => {
      expect(optional.some(4).isSome()).toBe(true);
    });

    it("#isNone", () => {
      expect(optional.some(4).isNone()).toBe(false);
    });

    it("does not allow some values with undefined", () => {
      expect(() => {
        optional.some(undefined);
      }).toThrow();
    });
  });

  describe("none", () => {
    it("#maybe", () => {
      expect(optional.none.maybe()).toBeUndefined();
    });

    it("#must", () => {
      expect(() => optional.none.must()).toThrow(
        "Unwrapped an optional with `must` but it is `none`"
      );
    });

    describe("#match", () => {
      it("validates", () => {
        expect(() => optional.none.match()).toThrow();
        expect(() => optional.none.match({ Some: () => "x" })).toThrow();
        expect(() => optional.none.match({ None: () => "x" })).toThrow();
      });

      it("runs `Some` condition", () => {
        expect(
          optional.none.match({ Some: val => val + 1, None: () => 0 })
        ).toEqual(0);
      });
    });

    describe("#orElse", () => {
      it("validates an optional is returned", () => {
        expect(() => optional.none.orElse("not an optional")).toThrow(
          "Optional.orElse must return another optional"
        );

        expect(() => optional.none.orElse(() => "not an optional")).toThrow(
          "Optional.orElse must return another optional"
        );
      });

      it("runs orElse condition", () => {
        const elseOptional = optional.some(4);
        expect(optional.none.orElse(elseOptional)).toBe(elseOptional);
        expect(optional.none.orElse(() => elseOptional)).toBe(elseOptional);
      });
    });

    it("#valueOrElse", () => {
      expect(optional.none.valueOrElse(100)).toBe(100);
    });

    it("#toArray", () => {
      expect(optional.none.toArray()).toEqual([]);
    });

    it("#isSome", () => {
      expect(optional.none.isSome()).toBe(false);
    });

    it("#isNone", () => {
      expect(optional.none.isNone()).toBe(true);
    });
  });

  describe("#fromNullable", () => {
    expect(optional.fromNullable()).toBe(optional.none);
    expect(optional.fromNullable(undefined)).toBe(optional.none);
    expect(optional.fromNullable(null)).toBe(optional.none);
    expect(optional.fromNullable(0).must()).toBe(0);
    expect(optional.fromNullable(false).must()).toBe(false);
    expect(optional.fromNullable("").must()).toBe("");
  });

  it("#isOptional", () => {
    expect(optional.isOptional(optional.none)).toBe(true);
    expect(optional.isOptional(optional.some(3))).toBe(true);
    expect(optional.isOptional("no way")).toBe(false);
  });
});
